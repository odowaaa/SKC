import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CompareService } from './compare.service';

@ApiTags('compare')
@ApiBearerAuth()
@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.compareService.list(user.id);
  }

  @Post(':propertyId')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.compareService.add(user.id, propertyId);
  }

  @Delete(':propertyId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.compareService.remove(user.id, propertyId);
  }

  @Delete()
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.compareService.clear(user.id);
  }
}
