import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('properties/:propertyId/reviews')
  list(@Param('propertyId') propertyId: string) {
    return this.reviewsService.listForProperty(propertyId);
  }

  @ApiBearerAuth()
  @Post('properties/:propertyId/reviews')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, propertyId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  @Patch('reviews/:id/approve')
  approve(@Param('id') id: string) {
    return this.reviewsService.approve(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR)
  @Delete('reviews/:id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
