import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StripeGateway } from './gateways/stripe.gateway';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeGateway: StripeGateway,
  ) {}

  @ApiBearerAuth()
  @Post()
  initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.initiate(user, dto);
  }

  @ApiBearerAuth()
  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listMine(user.id);
  }

  @Public()
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body');
    }

    const event = this.stripeGateway.constructEvent(req.rawBody, signature);

    if (
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      const intent = event.data.object as { id: string };
      const status =
        event.type === 'payment_intent.succeeded'
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.FAILED;
      await this.paymentsService.updateStatusByProviderRef(intent.id, status);
    }

    return { received: true };
  }
}
