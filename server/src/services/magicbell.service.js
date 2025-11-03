import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env.js';

const MAGICBELL_API_URL = 'https://api.magicbell.com';

/**
 * Send notification to MagicBell API
 * @param {string} userId - Internal user ID
 * @param {string} title - Notification title
 * @param {string} content - Notification content (can be markdown)
 * @param {string|null} eventId - Optional event ID
 * @returns {Promise<{id: string}>} - MagicBell notification ID
 */

export async function sendNotification(userId, title, content, eventId = null) {
  if (!config.MAGICBELL_API_KEY || !config.MAGICBELL_API_SECRET) {
    throw new Error('MagicBell API credentials not configured');
  }

  const payload = {
    title: title,
    content: content,
    recipients: [
      { external_id: userId }  // external_id to identify recipient
    ],
  };

  // Call MagicBell REST API to create a notification
  const response = await axios.post(
    `${MAGICBELL_API_URL}/notifications`,
    payload,
    {
      headers: {
        'X-MAGICBELL-API-KEY': config.MAGICBELL_API_KEY,
        'X-MAGICBELL-API-SECRET': config.MAGICBELL_API_SECRET,
        'Content-Type': 'application/json',
      },
    }
  );

  // MagicBell returns the created notification data
  const notification = response.data.notification || response.data;
  const magicbellId = notification.id || notification.notification_id;

  if (!magicbellId) {
    throw new Error('Failed to get MagicBell notification ID from response');
  }

  return { id: magicbellId };
}

/**
 * Generate HMAC for MagicBell user authentication
 * @param {string} userExternalId - User's external ID (typically user.id)
 * @returns {string} - HMAC hash for secure authentication
 */
export function generateUserHmac(userExternalId) {
  if (!config.MAGICBELL_API_SECRET) {
    throw new Error('MagicBell API secret not configured');
  }

  return crypto
    .createHmac('sha256', config.MAGICBELL_API_SECRET)
    .update(userExternalId.toString())
    .digest('base64');
}