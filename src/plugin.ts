import { registerDataPlugin } from "@builder.io/data-plugin-tools";
import pkg from "../package.json";
import appState from '@builder.io/app-context';
import { getCHToken } from "../lib/authentication";
import {
  ClientCredentialsScheme,
  ContentHubOneClientFactory,
  ContentHubOneClientOptions,
  ContentItemSearchField,
  ContentItemSearchRequest,
  Equality,
} from "@sitecore/contenthub-one-sdk";

const pluginId = pkg.name;
const metaFields = [
  "version",
  "status",
  "type",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "publishedBy",
  "publishedAt",
];
const chFieldTypes = [
  "Text",
  "Boolean",
  "Number",
  "Symbol",
  "Reference",
  "Media",
  "ShortText",
  "LongText",
];
const chFieldsTypesToExclude = ["Reference", "Media"];

registerDataPlugin(
  {
    id: pluginId,
    name: "Content Hub ONE",
    icon: "http://localhost:1268/public/ch1-icon.svg",
    // Settings is optional and it represents what input you need from the user to connect their data
    settings: [
      {
        name: "clientId",
        type: "string",
        required: true,
        helperText:
          "Get your Client ID from Content Hub ONE: Integration > OAuth > Client Credentials. https://doc.sitecore.com/ch-one/en/developers/content-hub-one/content-management-api--authentication.html",
      },
      {
        name: "clientSecret",
        type: "string",
        required: true,
        helperText:
          "Get your Client Secret from Content Hub ONE: Integration > OAuth > Client Credentials. https://doc.sitecore.com/ch-one/en/developers/content-hub-one/content-management-api--authentication.html",
      },
    ],
    ctaText: `Connect with your Content Hub One Tenant`,
  },
  // settings will be an Observable map of the settings configured above
  async (settings: { get: (arg0: string) => string }) => {
    let clientId = settings.get("clientId")?.trim();
    let clientSecret = settings.get("clientSecret")?.trim();
    const credentials = new ClientCredentialsScheme(
      clientId,
      clientSecret
    );
    const clientOptions = new ContentHubOneClientOptions({ allowUntrustedCertificates: true });
    const client = ContentHubOneClientFactory.create(credentials, clientOptions);
    const token = await getCHToken(clientId, clientSecret);
    return {
      async getResourceTypes() {
        const contentTypesCH1 = await client.contentTypes.enumerate();
        return contentTypesCH1.map((type) => {
          const acceptableFields = type.fields.filter((field) =>
            chFieldTypes.includes(field.type)
          );

          const buildHeaders = () => {
            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            };
  
            return Object.entries(headers)
              .map(([key, value]) => `headers.${key}=${value}`)
              .join('&');
          };

          const chTypesFormatted = {
            name: type.name["en-US"], // This en-US based read, ll be changed
            id: type.id,
            canPickEntries: true,
            inputs: () => {
              const fields: any = [
                {
                  name: "Page Number",
                  friendlName: "Page Number",
                  advanced: true,
                  defaultValue: 1,
                  min: 0,
                  max: 100,
                  type: "number",
                },
                {
                  name: "Page Size",
                  friendlName: "Page Size",
                  advanced: true,
                  defaultValue: 10,
                  min: 0,
                  max: 100,
                  type: "number",
                },
                {
                  name: "Order By",
                  type: "string",
                  enum: Object.keys(type.system)
                    .filter((key) => !metaFields.includes(key))
                    .map((key) => ({
                      label: key,
                      value: key,
                    }))
                    .concat(
                      acceptableFields
                        .filter(
                          (key) => !chFieldsTypesToExclude.includes(key.type)
                        )
                        .map((field) => ({
                          label: field.name["en-US"],
                          value: field.id,
                        }))
                    ),
                },
                {
                  name: "Search Query",
                  friendlName: "Search Query",
                  advanced: true,
                  type: "string",
                },
              ];
              if (acceptableFields.length > 0) {
                fields.push({
                  name: 'fields',
                  advanced: true,
                  type: 'object',
                  friendlyName: `${type.name["en-US"]} fields`,
                  subFields: acceptableFields.map(field => ({
                    type: field.type.toLowerCase(),
                    name: field.id,
                    friendlyName: field.name["en-US"],
                    helperText: `Query by a specific "${field.name["en-US"]}"" on ${type.name["en-US"]}`,
                  })),
                } as any);
              }
              return fields;
            },
            toUrl: (options: any) => {
              console.log('Fields:', options.fields)
              // by entry
              if (options.entry) {
                const url = `https://content-api.sitecorecloud.io/api/content/v1/items?id=${options.entry}`;
                return `https://cdn.builder.io/api/v1/proxy-api?url=${url}&${buildHeaders()}&apiKey=${appState.user.apiKey}`
              }

              let fields =
                (options.fields &&
                  Object.keys(options.fields).length > 0 &&
                  options.fields) ||
                null;

              if (fields) {
                fields = Object.keys(fields).reduce((acc, key) => {
                  const omitValue = fields[key] === "";
                  return {
                    ...acc,
                    ...(omitValue ? {} : { [key]: fields[key] }),
                  };
                }, {});
              }

              let url = 'https://content-api.sitecorecloud.io/api/content/v1/items?search=';
             // by query
             if (fields) {
               url += `${fields["Search Query"]}`;
             } 
             return `https://cdn.builder.io/api/v1/proxy-api?url=${url}&${buildHeaders()}&apiKey=${appState.user.apiKey}`
            },
          };
          return chTypesFormatted;
        });
      },
      async getEntriesByResourceType(
        id: any,
        options: { searchText: string; resourceEntryId: string }
      ) {
        const searchText = options?.searchText as string;
        const typeId = id;
        const entries = await client.contentItems.getAsync(
          new ContentItemSearchRequest().withFieldQuery(
              ContentItemSearchField.contentType,
              Equality.Equals,
              typeId
          ),
      );
        
        // specific entry...
        if (options?.resourceEntryId) {
          const entry = entries.data.find(
            (item) => item.id === options.resourceEntryId
          );
          if (entry) {
            return [
              {
                id: entry.id,
                name: entry.name,
              },
            ];
          }
        }
        // search query...
        else if (searchText != "") {
          return entries.data
            .filter(({ name }) =>
              name?.toLowerCase().includes(searchText?.toLowerCase())
            )
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
            }));
        }
        // get all entries...
        return entries.data.map((entry) => ({
          id: entry.id,
          name: entry.name,
        }));
      },
    };
  }
).then(() => {});

