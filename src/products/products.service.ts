import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private datbaseService: DatabaseService) {}

  async create(createProductDto: CreateProductDto) {
    return await this.datbaseService.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalProductsAvailable = await this.datbaseService.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalProductsAvailable / limit);

    await this.datbaseService.product.findMany();

    return {
      data: await this.datbaseService.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        total: totalProductsAvailable,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const productFound = await this.datbaseService.product.findUnique({
      where: { id, available: true },
    });

    // throw error if product not found.
    if (!productFound) {
      // throw new NotFoundException('Not found product with this id');
      throw new RpcException({
        message: `Not found product with this id ${id}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return productFound;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    delete updateProductDto.id;

    await this.findOne(id);

    return this.datbaseService.product.update({
      data: updateProductDto,
      where: { id },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.datbaseService.product.delete({
      where: { id },
    });
  }
}
