interface CHContent {
  system: SystemData;
  id: string;
  name: string;
  fields: ItemFields[];
}

interface SystemData {
  updatedAt: string;
  contentType: ContentTypeData;
  lastPublishProgress: PublishProgressData;
  type: string;
  version: string;
  status: string;
  createdBy: UserData;
  createdAt: string;
  updatedBy: UserData;
  publishedBy: UserData;
  publishedAt: string;
}

interface ContentTypeData {
  type: string;
  relatedType: string;
  id: string;
  uri: string;
}

interface PublishProgressData {
  type: string;
  status: string;
  triggeredBy: UserData;
  triggeredAt: string;
}

interface UserData {
  type: string;
  relatedType: string;
  id: string;
  uri: string;
}

interface ItemFields {
  id: string;
  name: Record<string, string>;
  type: string;
  required: boolean;
  helpText: Record<string, string>;
  reference: any | null;
}

export default CHContent;
