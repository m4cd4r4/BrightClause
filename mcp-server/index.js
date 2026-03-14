#!/usr/bin/env node
/**
 * BrightClause MCP Server
 *
 * Exposes BrightClause API endpoints as MCP tools for Claude interaction.
 * Enables AI-powered contract analysis queries during conversations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration
const API_URL = process.env.BRIGHTCLAUSE_API_URL || 'http://45.77.233.102:8003';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to call ${endpoint}: ${error.message}`);
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'brightclause',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_documents',
        description: 'List all uploaded contract documents with their processing status, page counts, and analysis stats.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of documents to return (default: 20)',
            },
            offset: {
              type: 'number',
              description: 'Number of documents to skip for pagination',
            },
          },
        },
      },
      {
        name: 'get_document',
        description: 'Get detailed information about a specific contract document including metadata, processing status, and analysis summary.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'get_clauses',
        description: 'Get all extracted clauses from a document with their risk levels, summaries, and content. Clause types include: termination, change_of_control, ip_assignment, indemnification, confidentiality, non_compete, payment_terms, warranty, governing_law, force_majeure, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'extract_clauses',
        description: 'Trigger AI clause extraction on a document. This analyzes the contract text and identifies legal clauses with risk assessments. Returns immediately - extraction runs in background.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document to analyze',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'search_contracts',
        description: 'Semantic search across all contracts using natural language. Finds relevant clauses and provisions by meaning, not just keywords. Great for questions like "find all liability caps" or "contracts with automatic renewal".',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query',
            },
            limit: {
              type: 'number',
              description: 'Maximum results to return (default: 10)',
            },
            semantic_weight: {
              type: 'number',
              description: 'Weight for semantic matching 0-1 (default: 0.7)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_knowledge_graph',
        description: 'Get the knowledge graph for a document showing entities (parties, people, dates, amounts, locations) and their relationships.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'extract_entities',
        description: 'Trigger entity extraction for knowledge graph generation. Identifies parties, people, dates, monetary amounts, and locations in the contract.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'get_analysis_summary',
        description: 'Get the analysis summary for a document including risk breakdown, clause statistics, and high-risk highlights.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'The UUID of the document',
            },
          },
          required: ['document_id'],
        },
      },
      {
        name: 'get_clause_types',
        description: 'List all 26 supported clause types that BrightClause can extract and analyze.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_clauses',
        description: 'Search for specific clause types across all documents. Filter by clause type and/or risk level.',
        inputSchema: {
          type: 'object',
          properties: {
            clause_type: {
              type: 'string',
              description: 'Filter by clause type (e.g., "termination", "change_of_control")',
            },
            risk_level: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Filter by risk level',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_documents': {
        const params = new URLSearchParams();
        if (args?.limit) params.set('limit', args.limit.toString());
        if (args?.offset) params.set('offset', args.offset.toString());
        const query = params.toString() ? `?${params}` : '';
        const result = await apiCall(`/documents${query}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_document': {
        const result = await apiCall(`/documents/${args.document_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_clauses': {
        const result = await apiCall(`/analysis/${args.document_id}/clauses`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'extract_clauses': {
        const result = await apiCall(`/analysis/${args.document_id}/extract`, {
          method: 'POST',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_contracts': {
        const body = {
          query: args.query,
          limit: args.limit || 10,
          semantic_weight: args.semantic_weight || 0.7,
        };
        const result = await apiCall('/search', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_knowledge_graph': {
        const result = await apiCall(`/graph/${args.document_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'extract_entities': {
        const result = await apiCall(`/graph/${args.document_id}/extract`, {
          method: 'POST',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_analysis_summary': {
        const result = await apiCall(`/analysis/${args.document_id}/summary`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_clause_types': {
        const result = await apiCall('/analysis/clause-types');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_clauses': {
        const params = new URLSearchParams();
        if (args?.clause_type) params.set('clause_type', args.clause_type);
        if (args?.risk_level) params.set('risk_level', args.risk_level);
        if (args?.limit) params.set('limit', args.limit.toString());
        const query = params.toString() ? `?${params}` : '';
        const result = await apiCall(`/search/clauses${query}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BrightClause MCP server running');
}

main().catch(console.error);
