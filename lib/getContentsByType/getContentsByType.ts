import axios, { AxiosResponse } from "axios";
import CHContent from "./types/index";

async function getContentsByType(token: string, id: string): Promise<CHContent[]> {
  var config = {
    method: "GET",
    url: "https://content-api.sitecorecloud.io/api/content/v1/items",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    params: {
      'system.contentType.id': id,
    },
  };

  console.log('Calling with ID:', id);

  try {
    let response = await axios<AxiosResponse<CHContent[]>>(config);
    return response.data?.data;
  } catch (error) {
    console.log(`Internal server error: ${error}`);
    return null as unknown as CHContent[];
  }
}
export default getContentsByType;
