declare module "generate-schema" {
  const generateSchema: {
    json(name: string, value: unknown): Record<string, unknown>;
  };
  export default generateSchema;
}
