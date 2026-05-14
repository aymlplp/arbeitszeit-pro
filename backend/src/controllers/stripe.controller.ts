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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID as string, // Your pro plan price ID
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
