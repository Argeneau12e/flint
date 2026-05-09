import { createClient } from '@supabase/supabase-js';

export type NotificationType =
  | 'invoice_created'
  | 'invoice_funded'
  | 'work_delivered'
  | 'payment_released'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'deadline_warning'
  | 'auto_approved'
  | 'auto_cancelled';

interface CreateNotificationParams {
  userId?: string;
  walletAddress: string;
  type: NotificationType;
  title: string;
  message: string;
  escrowId?: string;
}

/**
 * Create a notification in the database
 * (Email sending would be added here with SendGrid/Resend)
 */
export async function createNotification({
  userId,
  walletAddress,
  type,
  title,
  message,
  escrowId,
}: CreateNotificationParams) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase not configured for notifications');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase.from('notifications').insert({
    user_id: userId || null,
    wallet_address: walletAddress,
    type,
    title,
    message,
    escrow_id: escrowId,
    read: false,
    email_sent: false, // Set to true after sending email
  });

  if (error) {
    console.error('Create notification error:', error);
  }
}

/**
 * Send notification to seller when invoice is funded
 */
export async function notifyInvoiceFunded(
  sellerWallet: string,
  sellerUserId: string | undefined,
  invoiceTitle: string,
  amount: number,
  token: string,
  escrowId: string
) {
  await createNotification({
    userId: sellerUserId,
    walletAddress: sellerWallet,
    type: 'invoice_funded',
    title: 'Invoice Funded! 🎉',
    message: `${invoiceTitle} has been funded with ${amount} ${token}. Start working on the delivery!`,
    escrowId,
  });

  // TODO: Send email here when email service is configured
  // await sendEmail({ to: sellerEmail, subject: 'Invoice Funded!', ... })
}

/**
 * Send notification to buyer when work is delivered
 */
export async function notifyWorkDelivered(
  buyerWallet: string,
  buyerUserId: string | undefined,
  invoiceTitle: string,
  escrowId: string
) {
  await createNotification({
    userId: buyerUserId,
    walletAddress: buyerWallet,
    type: 'work_delivered',
    title: 'Work Delivered! 📦',
    message: `${invoiceTitle} - The seller has delivered the work. Please review and approve.`,
    escrowId,
  });
}

/**
 * Send notification when payment is released
 */
export async function notifyPaymentReleased(
  sellerWallet: string,
  sellerUserId: string | undefined,
  invoiceTitle: string,
  amount: number,
  token: string,
  escrowId: string
) {
  await createNotification({
    userId: sellerUserId,
    walletAddress: sellerWallet,
    type: 'payment_released',
    title: 'Payment Released! 💰',
    message: `${amount} ${token} has been released to your wallet for "${invoiceTitle}".`,
    escrowId,
  });
}

/**
 * Send notification when dispute is opened
 */
export async function notifyDisputeOpened(
  wallet: string,
  userId: string | undefined,
  invoiceTitle: string,
  escrowId: string,
  isSeller: boolean
) {
  await createNotification({
    userId,
    walletAddress: wallet,
    type: 'dispute_opened',
    title: isSeller ? 'Dispute Opened ⚠️' : 'Dispute Submitted ⚠️',
    message: isSeller
      ? `A dispute has been opened for "${invoiceTitle}". Please submit your evidence.`
      : `Your dispute for "${invoiceTitle}" has been submitted. AI review will begin shortly.`,
    escrowId,
  });
}

/**
 * Send deadline warning notification
 */
export async function notifyDeadlineWarning(
  wallet: string,
  userId: string | undefined,
  invoiceTitle: string,
  deadlineType: 'delivery' | 'review' | 'funding',
  escrowId: string
) {
  const titles = {
    delivery: 'Delivery Deadline Approaching ⏰',
    review: 'Review Deadline Approaching ⏰',
    funding: 'Payment Link Expiring Soon ⏰',
  };

  const messages = {
    delivery: `You have 24 hours to deliver "${invoiceTitle}".`,
    review: `You have 24 hours to review "${invoiceTitle}".`,
    funding: `Your payment link for "${invoiceTitle}" expires in 24 hours.`,
  };

  await createNotification({
    userId,
    walletAddress: wallet,
    type: 'deadline_warning',
    title: titles[deadlineType],
    message: messages[deadlineType],
    escrowId,
  });
}
