import { useAtomValue } from "@effect/atom-react";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import { McpServerId, type EnvironmentId, type McpServer } from "@t3tools/contracts";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { ensureLocalApi } from "../../localApi";
import { randomUUID } from "../../lib/utils";
import { usePrimaryEnvironmentId } from "../../state/environments";
import { environmentMcpServersAtom, mcpServerEnvironment } from "../../state/mcpServers";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { toastManager } from "../ui/toast";
import { SettingsPageContainer, SettingsRow, SettingsSection } from "./settingsLayout";

interface McpServerDraft {
  readonly name: string;
  readonly transport: "stdio" | "url";
  readonly command: string;
  readonly args: string;
  readonly url: string;
}

const EMPTY_DRAFT: McpServerDraft = {
  name: "",
  transport: "stdio",
  command: "",
  args: "",
  url: "",
};

function draftFromServer(server: McpServer): McpServerDraft {
  return server.transport === "stdio"
    ? {
        name: server.name,
        transport: server.transport,
        command: server.command,
        args: server.args?.join("\n") ?? "",
        url: "",
      }
    : {
        name: server.name,
        transport: server.transport,
        command: "",
        args: "",
        url: server.url,
      };
}

export function validateMcpServerDraft(draft: McpServerDraft): string | null {
  if (draft.name.trim().length === 0) return "Name is required.";
  if (draft.transport === "stdio") {
    return draft.command.trim().length === 0 ? "Command is required." : null;
  }
  try {
    const url = new URL(draft.url.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "URL must start with http:// or https://.";
    }
    return url.username.length === 0 && url.password.length === 0
      ? null
      : "Store credentials outside the server URL.";
  } catch {
    return "Enter a valid HTTP or HTTPS URL.";
  }
}

function commandDescription(server: McpServer): string {
  if (server.transport === "url") return server.url;
  return [server.command, ...(server.args ?? [])].join(" ");
}

function PluginsSettingsForEnvironment({
  environmentId,
}: {
  readonly environmentId: EnvironmentId;
}) {
  const servers = useAtomValue(environmentMcpServersAtom(environmentId));
  const createServer = useAtomCommand(mcpServerEnvironment.create, { reportFailure: false });
  const updateServer = useAtomCommand(mcpServerEnvironment.update, { reportFailure: false });
  const deleteServer = useAtomCommand(mcpServerEnvironment.delete, { reportFailure: false });
  const enableServer = useAtomCommand(mcpServerEnvironment.enable, { reportFailure: false });
  const disableServer = useAtomCommand(mcpServerEnvironment.disable, { reportFailure: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [draft, setDraft] = useState<McpServerDraft>(EMPTY_DRAFT);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const validationError = validateMcpServerDraft(draft);

  const openCreate = () => {
    setEditingServer(null);
    setDraft(EMPTY_DRAFT);
    setSubmitAttempted(false);
    setDialogOpen(true);
  };

  const openEdit = (server: McpServer) => {
    setEditingServer(server);
    setDraft(draftFromServer(server));
    setSubmitAttempted(false);
    setDialogOpen(true);
  };

  const reportFailure = (title: string, result: Awaited<ReturnType<typeof createServer>>) => {
    if (result._tag !== "Failure" || isAtomCommandInterrupted(result)) return false;
    const error = squashAtomCommandFailure(result);
    toastManager.add({
      type: "error",
      title,
      description: error instanceof Error ? error.message : "The command failed.",
    });
    return true;
  };

  const save = async () => {
    setSubmitAttempted(true);
    if (validationError !== null) return;

    const mcpServerId = editingServer?.id ?? McpServerId.make(randomUUID());
    setPendingServerId(mcpServerId);
    const configuration =
      draft.transport === "stdio"
        ? {
            name: draft.name.trim(),
            transport: draft.transport,
            command: draft.command.trim(),
            args: draft.args
              .split("\n")
              .map((argument) => argument.trim())
              .filter((argument) => argument.length > 0),
          }
        : {
            name: draft.name.trim(),
            transport: draft.transport,
            url: draft.url.trim(),
          };
    const result = editingServer
      ? await updateServer({ environmentId, input: { mcpServerId, ...configuration } })
      : await createServer({ environmentId, input: { mcpServerId, ...configuration } });
    setPendingServerId(null);
    if (
      reportFailure(
        editingServer ? "Could not update MCP server" : "Could not add MCP server",
        result,
      )
    ) {
      return;
    }
    setDialogOpen(false);
  };

  const toggle = async (server: McpServer, enabled: boolean) => {
    setPendingServerId(server.id);
    const mutation = enabled ? enableServer : disableServer;
    const result = await mutation({
      environmentId,
      input: { mcpServerId: server.id },
    });
    setPendingServerId(null);
    reportFailure(enabled ? "Could not enable MCP server" : "Could not disable MCP server", result);
  };

  const remove = async (server: McpServer) => {
    const confirmed = await ensureLocalApi().dialogs.confirm(
      `Delete the MCP server '${server.name}'?`,
      { variant: "destructive" },
    );
    if (!confirmed) return;
    setPendingServerId(server.id);
    const result = await deleteServer({
      environmentId,
      input: { mcpServerId: server.id },
    });
    setPendingServerId(null);
    reportFailure("Could not delete MCP server", result);
  };

  return (
    <SettingsPageContainer>
      <SettingsSection
        title="MCP servers"
        headerAction={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            Add server
          </Button>
        }
      >
        {servers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No MCP servers yet. A raw MCP server runs with or without Executor.
          </p>
        ) : (
          servers.map((server) => {
            const pending = pendingServerId === server.id;
            return (
              <SettingsRow
                key={server.id}
                title={server.name}
                description={commandDescription(server)}
                status={server.transport === "stdio" ? "Standard input/output" : "URL"}
                control={
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={server.enabled}
                      disabled={pending}
                      onCheckedChange={(checked) => void toggle(server, Boolean(checked))}
                      aria-label={`${server.enabled ? "Disable" : "Enable"} ${server.name}`}
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost-muted"
                      disabled={pending}
                      aria-label={`Edit ${server.name}`}
                      onClick={() => openEdit(server)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost-muted"
                      disabled={pending}
                      aria-label={`Delete ${server.name}`}
                      onClick={() => void remove(server)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                }
              />
            );
          })
        )}
      </SettingsSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingServer ? "Edit MCP server" : "Add MCP server"}</DialogTitle>
            <DialogDescription>
              Register a raw MCP server. Store credentials outside this record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel>Transport</FieldLabel>
              <Select
                value={draft.transport}
                onValueChange={(transport) => {
                  if (transport === "stdio" || transport === "url") {
                    setDraft({ ...draft, transport });
                  }
                }}
              >
                <SelectTrigger className="w-full" aria-label="MCP transport">
                  <SelectValue>
                    {draft.transport === "stdio" ? "Standard input/output" : "URL"}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="stdio">Standard input/output</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectPopup>
              </Select>
            </Field>
            {draft.transport === "stdio" ? (
              <>
                <Field>
                  <FieldLabel>Command</FieldLabel>
                  <Input
                    value={draft.command}
                    onChange={(event) => setDraft({ ...draft, command: event.currentTarget.value })}
                    placeholder="bunx"
                  />
                </Field>
                <Field>
                  <FieldLabel>Arguments, one per line</FieldLabel>
                  <Textarea
                    value={draft.args}
                    onChange={(event) => setDraft({ ...draft, args: event.currentTarget.value })}
                    placeholder={"@modelcontextprotocol/server-filesystem\n/workspace"}
                    rows={4}
                  />
                </Field>
              </>
            ) : (
              <Field>
                <FieldLabel>URL</FieldLabel>
                <Input
                  value={draft.url}
                  onChange={(event) => setDraft({ ...draft, url: event.currentTarget.value })}
                  placeholder="https://mcp.example.com"
                />
              </Field>
            )}
            {submitAttempted && validationError ? (
              <p className="text-xs text-destructive-foreground">{validationError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pendingServerId !== null} onClick={() => void save()}>
              {editingServer ? "Save" : "Add server"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </SettingsPageContainer>
  );
}

export function PluginsSettingsPanel() {
  const environmentId = usePrimaryEnvironmentId();
  if (environmentId === null) {
    return (
      <SettingsPageContainer>
        <SettingsSection title="MCP servers">
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Connect an environment to manage MCP servers.
          </p>
        </SettingsSection>
      </SettingsPageContainer>
    );
  }
  return <PluginsSettingsForEnvironment environmentId={environmentId} />;
}
