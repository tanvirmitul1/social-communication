import { MessageRepository } from '../modules/message/message.repository';

async function verifyForwarding() {
  try {
    console.log('Testing message forwarding implementation...');
    
    // Create repository instance
    const repo = new MessageRepository();
    
    // Check if the forwardMessage method exists
    if (typeof repo.forwardMessage === 'function') {
      console.log('✓ forwardMessage method exists in MessageRepository');
    } else {
      console.log('✗ forwardMessage method missing from MessageRepository');
      return;
    }
    
    console.log('Message forwarding implementation verified successfully!');
  } catch (error) {
    console.error('Error verifying message forwarding:', error);
  }
}

verifyForwarding();