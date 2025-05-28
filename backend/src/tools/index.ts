import { ToolDefinition } from '../shared/types';
import { searchEvents } from './searchEvents';
import { searchFlights } from './searchFlights';
import { createInvoice } from './createInvoice';
import { sendEmail } from './sendEmail';

export const AVAILABLE_TOOLS: Record<string, ToolDefinition> = {
  search_events: {
    name: 'search_events',
    description: 'Search for public events in a specific location and date range',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city or location to search for events'
        },
        startDate: {
          type: 'string',
          description: 'Start date for event search (YYYY-MM-DD format)'
        },
        endDate: {
          type: 'string',
          description: 'End date for event search (YYYY-MM-DD format)'
        },
        eventType: {
          type: 'string',
          description: 'Type of event (conference, concert, sports, etc.)'
        }
      },
      required: ['location', 'startDate', 'endDate']
    },
    requiresApproval: false
  },

  search_flights: {
    name: 'search_flights',
    description: 'Search for flights between two locations for specific dates',
    parameters: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport code or city'
        },
        destination: {
          type: 'string',
          description: 'Destination airport code or city'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date (YYYY-MM-DD format)'
        },
        returnDate: {
          type: 'string',
          description: 'Return date (YYYY-MM-DD format), optional for one-way trips'
        },
        passengers: {
          type: 'number',
          description: 'Number of passengers'
        }
      },
      required: ['origin', 'destination', 'departureDate', 'passengers']
    },
    requiresApproval: false
  },

  create_invoice: {
    name: 'create_invoice',
    description: 'Create a test invoice using Stripe (for demonstration purposes)',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Invoice amount in cents'
        },
        currency: {
          type: 'string',
          description: 'Currency code (e.g., USD, EUR)'
        },
        description: {
          type: 'string',
          description: 'Description of the invoice'
        },
        customerEmail: {
          type: 'string',
          description: 'Customer email address'
        }
      },
      required: ['amount', 'currency', 'description', 'customerEmail']
    },
    requiresApproval: true
  },

  send_email: {
    name: 'send_email',
    description: 'Send an email notification or confirmation',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address'
        },
        subject: {
          type: 'string',
          description: 'Email subject'
        },
        body: {
          type: 'string',
          description: 'Email body content'
        },
        template: {
          type: 'string',
          description: 'Email template name (optional)'
        }
      },
      required: ['to', 'subject', 'body']
    },
    requiresApproval: true
  }
};

export const TOOL_IMPLEMENTATIONS = {
  search_events: searchEvents,
  search_flights: searchFlights,
  create_invoice: createInvoice,
  send_email: sendEmail
};

export function getToolDefinition(toolName: string): ToolDefinition | undefined {
  return AVAILABLE_TOOLS[toolName];
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(AVAILABLE_TOOLS);
}

export function getToolsForGoal(goalName: string): ToolDefinition[] {
  // This would typically be configured based on your goals
  // For now, return all tools for demonstration
  switch (goalName) {
    case 'travel_planning':
      return [
        AVAILABLE_TOOLS.search_events,
        AVAILABLE_TOOLS.search_flights,
        AVAILABLE_TOOLS.create_invoice
      ];
    case 'event_management':
      return [
        AVAILABLE_TOOLS.search_events,
        AVAILABLE_TOOLS.send_email
      ];
    default:
      return getAllToolDefinitions();
  }
} 