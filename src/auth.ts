// src/auth.ts
import { Handler } from '@netlify/functions';
import axios from 'axios';

const { NOTION_CLIENT_ID, NOTION_REDIRECT_URI } = process.env;

const handler: Handler = async (event, context) => {
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}&response_type=code`;
 return {
    statusCode: 302,
    headers: {
      Location: authUrl,
    },
  };
};

export { handler };
