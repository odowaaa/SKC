import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignLeadDto, UpdateLeadStatusDto } from './dto/update-lead.dto';
import { CreateNoteDto, CreateTaskDto } from './dto/lead-activity.dto';

@ApiTags('leads')
@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post('properties/:propertyId/leads')
  capture(@Param('propertyId') propertyId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.captureFromProperty(propertyId, dto);
  }

  @ApiBearerAuth()
  @Get('leads')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.list(user);
  }

  @ApiBearerAuth()
  @Get('leads/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.findOne(user, id);
  }

  @ApiBearerAuth()
  @Patch('leads/:id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(user, id, dto.status);
  }

  @ApiBearerAuth()
  @Patch('leads/:id/assign')
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
  ) {
    return this.leadsService.assign(user, id, dto.assigneeId);
  }

  @ApiBearerAuth()
  @Post('leads/:id/notes')
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.leadsService.addNote(user, id, dto);
  }

  @ApiBearerAuth()
  @Post('leads/:id/tasks')
  addTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.leadsService.addTask(user, id, dto);
  }

  @ApiBearerAuth()
  @Patch('leads/tasks/:taskId/complete')
  completeTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
  ) {
    return this.leadsService.completeTask(user, taskId);
  }
}
