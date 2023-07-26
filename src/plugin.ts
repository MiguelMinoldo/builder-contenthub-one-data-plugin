import { registerDataPlugin } from "@builder.io/data-plugin-tools";
import pkg from "../package.json";
import { getCHToken, getEncryptedToken } from "../lib/authentication";
import { getContentTypes } from "../lib/getContentTypes";
import { getContentsByType } from "../lib/getContentsByType";

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
    var clientId = settings.get("clientId")?.trim();
    var clientSecret = settings.get("clientSecret")?.trim();
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
                  defaultValue: 1,
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
                      acceptableFields.map((field) => ({
                        label: field.name["en-US"],
                        value: field.id,
                      }))
                    ),
                },
              ];
              if (acceptableFields.length > 0) {
                fields.push({
                  name: "fields",
                  advanced: true,
                  type: "object",
                  friendlyName: `${type.name["en-US"]} fields`,
                  subFields: acceptableFields
                    .filter(
                      (field) => !chFieldsTypesToExclude.includes(field.type)
                    )
                    .map((field) => ({
                      type:
                        field.type === "Symbol"
                          ? "text"
                          : field.type.toLowerCase(),
                      name: field.id,
                      friendlyName: field.name["en-US"],
                      helperText: `Query by a specific "${field.name["en-US"]}"" on ${field.type}`,
                    })),
                } as any);
              }
              return fields;
            },
            toUrl: (options: any) => {
              // by entry
              if (options.entry) {
                return `https://contenthub-one-builder-router.vercel.app/api/chonecontent/${options.entry}?clientId=${encriptedClientId}&clientSecret=${encriptedClientSecret}`;
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

              // by query (TODO)
              return `https://contenthub-one-builder-router.vercel.app/api/chonecontent/${options.entry}?clientId=${encriptedClientId}&clientSecret=${encriptedClientSecret}`;
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
        console.log("Entries: " + JSON.stringify(entries));

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
