import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceStatusDto,
} from './dto/maintenance-request.dto';

@ApiTags('leases')
@ApiBearerAuth()
@Controller()
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post('leases')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeaseDto) {
    return this.leasesService.create(user, dto);
  }

  @Get('leases')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.leasesService.list(user);
  }

  @Get('leases/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leasesService.findOne(user, id);
  }

  @Post('leases/:id/invoices')
  generateInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.leasesService.generateInvoice(user, id, dto.dueDate);
  }

  @Patch('leases/:id/terminate')
  terminate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leasesService.terminate(user, id);
  }

  @Post('leases/:id/maintenance-requests')
  createMaintenanceRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMaintenanceRequestDto,
  ) {
    return this.leasesService.createMaintenanceRequest(user, id, dto);
  }

  @Get('leases/:id/maintenance-requests')
  listMaintenanceRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.leasesService.listMaintenanceRequests(user, id);
  }

  @Patch('maintenance-requests/:requestId/status')
  updateMaintenanceStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateMaintenanceStatusDto,
  ) {
    return this.leasesService.updateMaintenanceStatus(
      user,
      requestId,
      dto.status,
    );
  }
}
