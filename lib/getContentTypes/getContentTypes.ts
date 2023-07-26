import axios, { AxiosResponse } from "axios";
import CHContentType from "./types/index";
async function getContentTypes(token: string): Promise<CHContentType[]> {
  var config = {
    method: "GET",
    url: "https://content-api.sitecorecloud.io/api/content/v1/types",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: token,
  };
  try {
    let response = await axios<AxiosResponse<CHContentType[]>>(config);
    return response.data?.data;
  }catch (error) {
    console.log(`Internal server error: ${error}`);
    return null as unknown as CHContentType[];
  }
}

export default getContentTypes;