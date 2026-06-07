import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia' as any, // latest typings hack or whatever is available
});

export const createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let customerId = user.stripeCustId;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustId: customerId } });
    }

    const { plan } = req.body;
    let priceId = process.env.STRIPE_PRICE_ID;
    
    if (user.role === 'EMPLOYER') {
      if (plan === 'pro_yearly') {
        priceId = process.env.STRIPE_PRICE_ID_EMPLOYER_YEARLY || process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID;
      } else if (plan === 'pro_monthly') {
        priceId = process.env.STRIPE_PRICE_ID_EMPLOYER_MONTHLY || process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;
      }
    } else {
      if (plan === 'pro_yearly') {
        priceId = process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID;
      } else if (plan === 'pro_monthly') {
        priceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId as string,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

export const createPortalSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.stripeCustId) return res.status(404).json({ message: 'User or Customer not found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // This is a raw buffer due to express.raw parser
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log(`[Stripe Event Received]: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer as string;

        if (customerId) {
          await prisma.user.update({
            where: { stripeCustId: customerId },
            data: { plan: 'PRO' },
          });
          console.log(`[Stripe] User with CustomerId ${customerId} upgraded to PRO`);
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        if (customerId) {
          const isPro = subscription.status === 'active' || subscription.status === 'trialing';
          await prisma.user.update({
            where: { stripeCustId: customerId },
            data: { plan: isPro ? 'PRO' : 'FREE' },
          });
          console.log(`[Stripe] User with CustomerId ${customerId} plan set to: ${isPro ? 'PRO' : 'FREE'}`);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook Processing Error]:`, error);
    next(error);
  }
};
