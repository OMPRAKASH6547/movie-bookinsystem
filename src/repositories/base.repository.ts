import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  ProjectionType,
} from "mongoose";

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findById(id: string, projection?: ProjectionType<T>): Promise<T | null> {
    return this.model.findById(id, projection).exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>
  ): Promise<T | null> {
    return this.model.findOne(filter, projection).exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { skip = 0, limit = 20, sort = { createdAt: -1 }, ...rest } = options;
    return this.model.find(filter, null, { skip, limit, sort, ...rest }).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }
}
