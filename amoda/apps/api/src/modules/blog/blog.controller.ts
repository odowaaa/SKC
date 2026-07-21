import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';

const CONTENT_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER];

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  list(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.blogService.listPublished(Number(page), Number(limit));
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...CONTENT_ROLES)
  @Get('admin/all')
  listAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.blogService.listAll(Number(page), Number(limit));
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...CONTENT_ROLES)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.blogService.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...CONTENT_ROLES)
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...CONTENT_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
