interface Name {
  "en-US": string; // This will be changed
}

interface Description {
  "en-US": string; // This will be changed
}

interface CHField {
  id: string;
  name: Name;
  type: string;
  required: boolean;
  helpText: HelpText;
  reference: any;
}

interface HelpText {
  "en-US": string;
}

interface CHSystem {
  type: string;
  version: string;
  status: any;
  createdBy: CreatedBy;
  createdAt: string;
  updatedBy: UpdatedBy;
  updatedAt: string;
  publishedBy: any;
  publishedAt: any;
}

interface CreatedBy {
  type: string;
  relatedType: string;
  id: string;
  uri: string;
}

interface UpdatedBy {
  type: string;
  relatedType: string;
  id: string;
  uri: string;
}

interface CHContentType {
  name: Name;
  id: string;
  description: Description;
  fields: CHField[];
  system: CHSystem;
}

export default CHContentType;
