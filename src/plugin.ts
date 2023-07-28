import { registerDataPlugin } from "@builder.io/data-plugin-tools";
import pkg from "../package.json";
import { getCHToken, getEncryptedToken } from "../lib/authentication";
import { getContentTypes } from "../lib/getContentTypes";
import { getContentsByType } from "../lib/getContentsByType";
import qs from "qs";

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
    const token = await getCHToken(clientId, clientSecret);
    const encriptedClientId = await getEncryptedToken(clientId);
    const encriptedClientSecret = await getEncryptedToken(clientSecret);
    return {
      async getResourceTypes() {
        const contentTypesCH1 = await getContentTypes(token);
        return contentTypesCH1.map((type) => {
          const acceptableFields = type.fields.filter((field) =>
            chFieldTypes.includes(field.type)
          );
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
              return fields;
            },
            toUrl: (options: any) => {
              // by entry
              if (options.entry) {
                const params = qs.stringify({
                  clientId: encriptedClientId,
                  clientSecret: encriptedClientSecret,
                  contentId: options.entry,
                });
                return `https://contenthub-one-builder-router.vercel.app/api/chonecontent/${params}`;
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

              const params = qs.stringify({
                ...options,
                fields,
                clientId: encriptedClientId,
                clientSecret: encriptedClientSecret,
              });

              // by query (TODO)
              return `https://contenthub-one-builder-router.vercel.app/api/chonesearch?${params}`;
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
        const entries = await getContentsByType(token, typeId);

        // specific entry...
        if (options?.resourceEntryId) {
          const entry = entries.find(
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
          return entries
            .filter(({ name }) =>
              name.toLowerCase().includes(searchText?.toLowerCase())
            )
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
            }));
        }
        // get all entries...
        return entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
        }));
      },
    };
  }
).then(() => {});
