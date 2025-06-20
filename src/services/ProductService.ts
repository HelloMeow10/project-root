// src/services/ProductService.ts
import { prisma } from '../config/db';
import { ProductRepository } from '../repositories/ProductRepository';
import { Producto } from '../models/producto';

// Define an interface for the component structure, used in the mapped product
interface ProductoComponente {
  id_producto: number;
  nombre: string;
  // tipo?: string; // Uncomment if type was selected in repo for components
}

// The main Producto interface (assumed to be imported from ../models/producto)
// will be augmented by mapPrismaProductoToProducto to include 'componentes'
// This means the return type of mapPrismaProductoToProducto and methods using it
// will effectively be Producto & { componentes?: ProductoComponente[] }

function mapPrismaProductoToProducto(prismaProducto: any): Producto & { componentes?: ProductoComponente[] } {
  let componentes: ProductoComponente[] = [];
  if (prismaProducto.paqueteDetallesAsPaquete && prismaProducto.paqueteDetallesAsPaquete.length > 0) {
    componentes = prismaProducto.paqueteDetallesAsPaquete.map((detalle: any) => ({
      id_producto: detalle.producto.id_producto,
      nombre: detalle.producto.nombre,
      // tipo: detalle.producto.tipoProducto?.nombre // Uncomment if type was selected in repo
    }));
  }

  return {
    id_producto: prismaProducto.id_producto,
    nombre: prismaProducto.nombre,
    tipo: prismaProducto.tipoProducto?.nombre, // Deriva el nombre del tipo si está incluido
    descripcion: prismaProducto.descripcion,
    precio: prismaProducto.precio,
    stock: prismaProducto.stock,
    activo: prismaProducto.activo,
    id_tipo: prismaProducto.id_tipo,
    componentes: componentes.length > 0 ? componentes : undefined // Add componentes, omit if empty
  };
}

export class ProductService {
  private repo = new ProductRepository();

  async obtenerProductosIndividuales(): Promise<Producto[]> {
    const tipoPaquete = await prisma.tipoProducto.findUnique({
      where: { nombre: 'paquete' },
      select: { id_tipo: true }
    });

    if (!tipoPaquete) {
      console.error("TipoProducto 'paquete' not found. Cannot filter for individual products.");
      return []; // Or throw an error, depending on desired strictness
    }

    const productosIndividuales = await this.repo.findAllWhereNotTipo(tipoPaquete.id_tipo);
    return productosIndividuales.map(mapPrismaProductoToProducto);
  }

  // Obtiene todos los productos disponibles
  async obtenerProductos(): Promise<Producto[]> {
    const productos = await this.repo.findAll();
    return productos.map(mapPrismaProductoToProducto);
  }

  // Obtiene un producto por ID, lanza error si no existe
  async obtenerProductoPorId(id: number): Promise<Producto> {
    const producto = await this.repo.findById(id);
    if (!producto) throw new Error('Producto no encontrado');
    return mapPrismaProductoToProducto(producto);
  }

  // Crea un producto, validando datos (ejemplo simple)
  async crearProducto(data: { 
    nombre: string; 
    tipo?: string; // This is the string like 'auto', 'vuelo'
    precio: number; 
    descripcion?: string; 
    stock?: number; 
    activo?: boolean; 
  }): Promise<Producto> {
    if (data.precio < 0) throw new Error('El precio debe ser positivo');
    if (!data.tipo) throw new Error('El campo tipo (string del nombre del tipo) es requerido');

    const tipoProductoRecord = await prisma.tipoProducto.findUnique({
      where: { nombre: data.tipo },
    });

    if (!tipoProductoRecord) {
      throw new Error(`Tipo de producto '${data.tipo}' no encontrado.`);
    }
    const id_tipo_resolved = tipoProductoRecord.id_tipo;

    const prismaData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      stock: data.stock,
      activo: data.activo !== undefined ? data.activo : true,
      id_tipo: id_tipo_resolved, 
    };
    const producto = await this.repo.create(prismaData);
    return mapPrismaProductoToProducto(producto);
  }

  async actualizarProducto(id: number, data: {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    activo?: boolean;
    tipo?: string; // string like 'auto', 'vuelo'
  }): Promise<Producto> {
    const existingProduct = await this.repo.findById(id);
    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    const prismaUpdateData: any = {};

    if (data.nombre !== undefined) prismaUpdateData.nombre = data.nombre;
    if (data.descripcion !== undefined) prismaUpdateData.descripcion = data.descripcion;
    if (data.precio !== undefined) {
      if (data.precio < 0) throw new Error('El precio debe ser positivo');
      prismaUpdateData.precio = data.precio;
    }
    if (data.stock !== undefined) prismaUpdateData.stock = data.stock;
    if (data.activo !== undefined) prismaUpdateData.activo = data.activo;

    if (data.tipo) {
      const tipoProductoRecord = await prisma.tipoProducto.findUnique({
        where: { nombre: data.tipo },
      });
      if (!tipoProductoRecord) {
        throw new Error(`Tipo de producto '${data.tipo}' no encontrado.`);
      }
      prismaUpdateData.id_tipo = tipoProductoRecord.id_tipo;
    }

    // Optional: Could add a check here if Object.keys(prismaUpdateData).length === 0
    // to avoid an unnecessary update call if only data.tipo was provided and it resolved to the same id_tipo.
    // For now, allowing the update call regardless.

    const productoActualizado = await this.repo.update(id, prismaUpdateData);
    return mapPrismaProductoToProducto(productoActualizado);
  }

  // Elimina un producto
  async deleteProduct(id: number) {
    // Optional: First check if product exists
    const productExists = await this.repo.findById(id);
    if (!productExists) {
      throw new Error('Producto no encontrado'); // This error can be caught by controller
    }

    try {
      return await this.repo.delete(id);
    } catch (err: any) { // Use 'any' or Prisma.PrismaClientKnownRequestError
      if (err.code === 'P2003') { // Foreign key constraint violation
        console.error(`Attempted to delete product ${id} which has foreign key constraints.`, err);
        throw new Error('Este producto está referenciado y no puede ser eliminado.'); 
      }
      // P2025 is "Record to delete not found." - handled by check above, but good as fallback.
      if (err.code === 'P2025') { 
          console.error(`Attempted to delete non-existent product ${id}.`, err);
          throw new Error('Producto no encontrado para eliminar.');
      }
      console.error(`Error deleting product ${id} in ProductService:`, err);
      throw err; // Re-throw other errors
    }
  }

  async agregarComponenteAPaqueteServ(id_paquete: number, id_producto_componente: number, cantidad: number): Promise<Producto> {
    // Fetch the package product to ensure it exists and is a package
    const paqueteProducto = await this.repo.findById(id_paquete); // Renamed 'paquete' to 'paqueteProducto' for clarity with logs

    console.log(`[Svc AddComp Detail] Start validation for id_paquete ${id_paquete}.`);
    
    if (!paqueteProducto) {
        console.error(`[Svc AddComp Detail] VALIDATION FAIL: paqueteProducto (id: ${id_paquete}) NOT FOUND.`);
        throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
    }
    console.log(`[Svc AddComp Detail] paqueteProducto IS found. Name: ${paqueteProducto.nombre}`);

    if (!paqueteProducto.tipoProducto) {
        console.error(`[Svc AddComp Detail] VALIDATION FAIL: paqueteProducto.tipoProducto IS UNDEFINED/NULL for id_paquete ${id_paquete}. Full object:`, JSON.stringify(paqueteProducto, null, 2));
        throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
    }
    console.log(`[Svc AddComp Detail] paqueteProducto.tipoProducto IS found. Name: ${paqueteProducto.tipoProducto.nombre}`);

    // Assuming tipoProducto.nombre is already a string, no need for .toLowerCase() if the comparison is exact
    const isCorrectType = paqueteProducto.tipoProducto.nombre === 'paquete'; 
    console.log(`[Svc AddComp Detail] Is correct type ('paqueteProducto.tipoProducto.nombre === "paquete"'): ${isCorrectType}`);

    if (!isCorrectType) {
        console.error(`[Svc AddComp Detail] VALIDATION FAIL: Type is NOT 'paquete'. Actual type: '${paqueteProducto.tipoProducto.nombre}'.`);
        throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
    }

    console.log(`[Svc AddComp Detail] All validations passed for id_paquete ${id_paquete}.`);
    
    // Fetch the component product to ensure it exists and is NOT a package
    const componente = await this.repo.findById(id_producto_componente);
    if (!componente) {
      throw new Error("Producto componente no encontrado.");
    }
    if (componente.tipo?.toLowerCase() === 'paquete') {
      throw new Error("No se puede agregar un paquete como componente de otro paquete.");
    }
    
    if (id_paquete === id_producto_componente) {
      throw new Error("Un paquete no puede ser componente de sí mismo.");
    }

    // Check if the component already exists in the package
    const existingDetail = await prisma.paqueteDetalle.findFirst({
      where: {
        id_paquete: id_paquete,
        id_producto: id_producto_componente,
      },
    });

    if (existingDetail) {
      // For now, throw an error. Future enhancement could update quantity.
      throw new Error("Este componente ya existe en el paquete. Modifique su cantidad si es necesario o elimínelo primero.");
    }

    // Create the PaqueteDetalle record
    await prisma.paqueteDetalle.create({
      data: {
        id_paquete: id_paquete,
        id_producto: id_producto_componente,
        cantidad: cantidad,
      },
    });

    // Fetch and return the updated package product with all its details
    return this.obtenerProductoPorId(id_paquete);
  }

  async eliminarComponenteDePaqueteServ(id_paquete: number, id_producto_componente: number): Promise<Producto> {
    // Fetch the package product to ensure it exists
    const paquete = await this.repo.findById(id_paquete);
    if (!paquete) { // It implicitly also checks if it's a package via its components later
      throw new Error("Paquete base no encontrado.");
    }

    const deleteResult = await prisma.paqueteDetalle.deleteMany({
      where: {
        id_paquete: id_paquete,
        id_producto: id_producto_componente,
      },
    });

    if (deleteResult.count === 0) {
      throw new Error("Componente no encontrado en este paquete o ya fue eliminado.");
    }

    // Fetch and return the updated package product with all its details
    return this.obtenerProductoPorId(id_paquete);
  }
}
