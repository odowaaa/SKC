import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferStatusDto } from './dto/update-offer-status.dto';

@ApiTags('offers')
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('properties/:propertyId/offers')
  create(@Param('propertyId') propertyId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(propertyId, dto);
  }

  @ApiBearerAuth()
  @Get('offers')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.offersService.list(user);
  }

  @ApiBearerAuth()
  @Patch('offers/:id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOfferStatusDto,
  ) {
    return this.offersService.updateStatus(user, id, dto.status);
  }
}
