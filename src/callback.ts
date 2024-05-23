import { Handler } from '@netlify/functions';
import axios from 'axios';

const { NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI } = process.env;

const handler: Handler = async (event, context) => {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization code' }),
    };
  }

  console.log("Authorization code:", code);
  console.log("Client ID:", NOTION_CLIENT_ID);
  console.log("Client Secret:", NOTION_CLIENT_SECRET);
  console.log("Redirect URI:", NOTION_REDIRECT_URI);

  const data = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: NOTION_REDIRECT_URI,
    client_id: NOTION_CLIENT_ID,
    client_secret: NOTION_CLIENT_SECRET,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`,
    'Notion-Version': '2022-06-28',
  };

  try {
    const response = await axios.post('https://api.notion.com/v1/oauth/token', data, { headers });

    const accessToken = response.data;

    console.log("Access Token:", response.data);

    // Aquí puedes guardar el accessToken en tu base de datos o usarlo para acceder a los recursos de Notion
    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken }),
    };
  } catch (error: any) {
    // Extraer información relevante del error sin intentar convertir todo el objeto
    const errorDetails = error.response ? error.response.data : error.message;
    console.error("Error response data:", errorDetails);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener el token de acceso', details: errorDetails }),
    };
  }
};

export { handler };
