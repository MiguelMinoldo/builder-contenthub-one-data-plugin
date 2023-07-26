import axios from "axios";

async function getEncryptedToken(token: string) {
  var config = {
    method: "GET",
    url: "https://contenthub-one-builder-router.vercel.app/api/authorize",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
  };

  let response = await axios(config);
  
  return response.data.encryptedToken;
}

export default getEncryptedToken;