import qs from "qs";
import axios from "axios";
import { Colors } from "../../consts/colorsConstants";
async function getCHToken(clientId: string, clientSecret: string) {
  var token = "";
  var data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: "https://api.sitecorecloud.io",
  });
  var config = {
    method: "post",
    url: "https://auth.sitecorecloud.io/oauth/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      token = JSON.stringify(response.data.access_token);
    })
    .catch(function (error) {
      console.log(Colors.ERROR, "ERROR: " + error);
    });

  token = token.replace(/"/g, "");
  console.log(
    Colors.SUCCESS,
    "Token Generated: " + token.substring(0, 10) + "..."
  );

  return token;
}

export default getCHToken;
