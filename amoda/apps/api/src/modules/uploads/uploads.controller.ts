import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('signature')
  signature() {
    return this.cloudinary.generateUploadSignature();
  }

  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinary.uploadBuffer(file.buffer);

    return this.prisma.file.create({
      data: {
        uploaderId: user.id,
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'CLOUDINARY',
        mimeType: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname,
      },
    });
  }
}
