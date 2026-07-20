import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, Loader2, Sparkles } from "lucide-react";
import Ajv2020 from "ajv/dist/2020";
import generateSchema from "generate-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EmailParseResultResponse, ParseEmailRequest } from "../model/types";
import { EmailParseStatus } from "../model/types";

const DEFAULT_MODEL = "DEFAULT";

interface ParsePanelProps {
  canParse: boolean;
  parsing: boolean;
  hasSelectedEmail: boolean;
  selectedMessageId: string | null;
  /** Allowed model overrides; empty hides the picker. */
  aiModels: string[];
  defaultAiModel: string | null;
  result: EmailParseResultResponse | null;
  onParse: (request: ParseEmailRequest) => void;
}

const textareaClassName =
  "placeholder:text-muted-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border " +
  "bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none " +
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 font-mono";

const EXPECTED_SCHEMA_PLACEHOLDER =
  '{"type":"object","additionalProperties":false,"properties":{"invoiceNumber":{"type":"string"}},"required":["invoiceNumber"]}';
const EXPECTED_EXAMPLE_PLACEHOLDER = '{"invoiceNumber":"INV-1001","total":125.50,"dueDate":null}';

const normalizeForStrictOutput = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeForStrictOutput);
  if (value === null || typeof value !== "object") return value;
  const schema = value as Record<string, unknown>;
  const properties = schema.properties as Record<string, unknown> | undefined;
  const normalized: Record<string, unknown> = Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== "$schema")
      .map(([key, child]) => [key, normalizeForStrictOutput(child)])
  );
  if (schema.type === "null") normalized.type = ["string", "null"];
  if (schema.type === "object" && properties) {
    normalized.additionalProperties = false;
    normalized.required = Object.keys(properties);
  }
  return normalized;
};

export const ParsePanel: React.FC<ParsePanelProps> = ({
  canParse,
  parsing,
  hasSelectedEmail,
  selectedMessageId,
  aiModels,
  defaultAiModel,
  result,
  onParse,
}) => {
  const { t } = useTranslation();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [expectedJsonSchema, setExpectedJsonSchema] = useState("");
  const [expectedJsonExample, setExpectedJsonExample] = useState("");
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [exampleError, setExampleError] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState(DEFAULT_MODEL);

  // The allowed list can change (e.g. connector switch); never keep a model that left it.
  useEffect(() => {
    if (aiModel !== DEFAULT_MODEL && !aiModels.includes(aiModel)) {
      setAiModel(DEFAULT_MODEL);
    }
  }, [aiModels, aiModel]);

  const formatSchema = (): Record<string, unknown> | null => {
    try {
      const schema = JSON.parse(expectedJsonSchema) as Record<string, unknown>;
      if (!schema || Array.isArray(schema) || schema.type !== "object") {
        throw new Error(t("emailParsingLab.parse.schemaRootError"));
      }
      new Ajv2020({ strict: false }).compile(schema);
      setExpectedJsonSchema(JSON.stringify(schema, null, 2));
      setSchemaError(null);
      return schema;
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : t("emailParsingLab.parse.invalidJson"));
      return null;
    }
  };

  const formatExample = (): unknown | null => {
    try {
      const example = JSON.parse(expectedJsonExample);
      setExpectedJsonExample(JSON.stringify(example, null, 2));
      setExampleError(null);
      return example;
    } catch (error) {
      setExampleError(error instanceof Error ? error.message : t("emailParsingLab.parse.invalidJson"));
      return null;
    }
  };

  const generateSchemaFromExample = () => {
    const example = formatExample();
    if (example === null) return;
    const generated = normalizeForStrictOutput(generateSchema.json("EmailParseResult", example));
    setExpectedJsonSchema(JSON.stringify(generated, null, 2));
    setSchemaError(null);
  };

  const handleParse = () => {
    const schema = expectedJsonSchema.trim() ? formatSchema() : undefined;
    if (expectedJsonSchema.trim() && !schema) return;
    onParse({
      systemPrompt: systemPrompt.trim() || undefined,
      expectedJsonSchema: schema ?? undefined,
      aiModel: aiModel === DEFAULT_MODEL ? undefined : aiModel,
    });
  };

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="font-semibold flex items-center">
        <Sparkles className="h-4 w-4 mr-2" />
        {t("emailParsingLab.parse.title")}
      </h3>

      <div className="space-y-2">
        <Label htmlFor="parse-system-prompt">{t("emailParsingLab.parse.systemPromptLabel")}</Label>
        <textarea
          id="parse-system-prompt"
          rows={2}
          maxLength={2000}
          className={textareaClassName}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={t("emailParsingLab.parse.systemPromptPlaceholder")}
          disabled={!canParse || parsing}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parse-expected-schema">{t("emailParsingLab.parse.expectedSchemaLabel")}</Label>
        <textarea
          id="parse-expected-schema"
          rows={6}
          maxLength={4000}
          className={textareaClassName}
          value={expectedJsonSchema}
          onChange={(e) => setExpectedJsonSchema(e.target.value)}
          placeholder={EXPECTED_SCHEMA_PLACEHOLDER}
          disabled={!canParse || parsing}
        />
        <Button type="button" variant="outline" size="sm" onClick={formatSchema} disabled={!canParse || parsing}>
          {t("emailParsingLab.parse.formatValidate")}
        </Button>
        {schemaError && <p className="text-xs text-destructive">{schemaError}</p>}
        <p className="text-xs text-muted-foreground">{t("emailParsingLab.parse.expectedSchemaHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parse-expected-example">{t("emailParsingLab.parse.expectedExampleLabel")}</Label>
        <textarea
          id="parse-expected-example"
          rows={4}
          className={textareaClassName}
          value={expectedJsonExample}
          onChange={(e) => setExpectedJsonExample(e.target.value)}
          placeholder={EXPECTED_EXAMPLE_PLACEHOLDER}
          disabled={!canParse || parsing}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={formatExample} disabled={!canParse || parsing}>
            {t("emailParsingLab.parse.formatValidate")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateSchemaFromExample}
            disabled={!canParse || parsing}
          >
            {t("emailParsingLab.parse.generateSchema")}
          </Button>
        </div>
        {exampleError && <p className="text-xs text-destructive">{exampleError}</p>}
        <p className="text-xs text-muted-foreground">{t("emailParsingLab.parse.expectedExampleHint")}</p>
      </div>

      {aiModels.length > 0 && (
        <div className="space-y-2">
          <Label>{t("emailParsingLab.parse.modelLabel")}</Label>
          <Select value={aiModel} onValueChange={setAiModel} disabled={!canParse || parsing}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_MODEL}>
                {defaultAiModel
                  ? t("emailParsingLab.parse.modelDefaultNamed", { model: defaultAiModel })
                  : t("emailParsingLab.parse.modelDefault")}
              </SelectItem>
              {aiModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={handleParse} disabled={!canParse || !hasSelectedEmail || parsing}>
        {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {parsing ? t("emailParsingLab.parse.inProgress") : t("emailParsingLab.parse.button")}
      </Button>

      {parsing ? (
        // Replaces the previous result while a parse runs, so stale output can't be read as the new one.
        <div className="border rounded-md p-6 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("emailParsingLab.parse.inProgress")}
        </div>
      ) : (
        result && <ParseResultView result={result} selectedMessageId={selectedMessageId} />
      )}
    </div>
  );
};

export const ParseResultView: React.FC<{
  result: EmailParseResultResponse;
  selectedMessageId?: string | null;
}> = ({ result, selectedMessageId }) => {
  const { t } = useTranslation();
  const failed = result.status === EmailParseStatus.FAILED;
  const differentEmail = selectedMessageId != null && result.providerMessageId !== selectedMessageId;

  return (
    <div className="space-y-2">
      {differentEmail && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="mr-1 h-3.5 w-3.5 shrink-0" />
          {t("emailParsingLab.result.differentEmailHint", {
            subject: result.subject ?? "",
            from: result.from ?? "",
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={failed ? "destructive" : "default"}>{t(`emailParsingLab.status.${result.status}`)}</Badge>
        <Badge variant="outline">{t(`emailParsingLab.source.${result.source}`)}</Badge>
        {result.aiProvider && <Badge variant="secondary">{result.aiProvider}</Badge>}
        {result.aiModel && <Badge variant="secondary">{result.aiModel}</Badge>}
        {result.attachmentsProcessed != null && (
          <span className="text-xs text-muted-foreground">
            {t("emailParsingLab.result.attachments", {
              processed: result.attachmentsProcessed,
              skipped: result.attachmentsSkipped ?? 0,
            })}
          </span>
        )}
      </div>

      {failed && result.errorMessage && <div className="text-sm text-destructive">{result.errorMessage}</div>}

      <pre
        className={cn(
          "text-xs border rounded-md p-3 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap",
          failed ? "border-destructive/50 bg-destructive/5" : "bg-muted/30"
        )}
      >
        {result.resultJson
          ? JSON.stringify(result.resultJson, null, 2)
          : result.resultText || t("emailParsingLab.result.empty")}
      </pre>
    </div>
  );
};
