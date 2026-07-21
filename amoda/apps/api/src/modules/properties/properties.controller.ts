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
import { PropertyStatus, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { AttachMediaDto } from './dto/attach-media.dto';

const LISTING_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.REGIONAL_MANAGER,
  Role.BRANCH_MANAGER,
  Role.PROPERTY_MANAGER,
  Role.AGENT,
  Role.DEVELOPER,
  Role.OWNER,
];

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  search(@Query() query: SearchPropertyDto) {
    return this.propertiesService.search(query);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.propertiesService.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...LISTING_ROLES)
  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.listMine(user);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR, Role.PROPERTY_MANAGER)
  @Get('admin/all')
  listAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: PropertyStatus,
  ) {
    return this.propertiesService.listAll({
      page: Number(page),
      limit: Number(limit),
      status,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Public()
  @Get(':id/similar')
  similar(@Param('id') id: string) {
    return this.propertiesService.similar(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...LISTING_ROLES)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...LISTING_ROLES)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...LISTING_ROLES)
  @Post(':id/media')
  attachMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AttachMediaDto,
  ) {
    return this.propertiesService.attachMedia(user, id, dto.media);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...LISTING_ROLES)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.propertiesService.remove(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MARKETING_MANAGER)
  @Patch(':id/feature')
  feature(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
    return this.propertiesService.setFeatured(id, isFeatured);
  }
}
