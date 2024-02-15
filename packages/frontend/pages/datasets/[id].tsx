import PromptVariableEditor from "@/components/Blocks/PromptVariableEditor"
import { PromptEditor } from "@/components/Prompts/PromptEditor"
import {
  useDataset,
  useDatasetPrompt,
  useDatasetPromptVariation,
} from "@/utils/dataHooks"
import { usePromptVariables } from "@/utils/promptsHooks"
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Container,
  Fieldset,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from "@mantine/core"
import { useDebouncedState } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

function PromptVariation({ i, variationId, variables, onDelete }) {
  const { variation, update, remove, mutate } =
    useDatasetPromptVariation(variationId)

  const { prompt } = useDatasetPrompt(variation?.promptId)

  const hasVariables = Object.keys(variables).length > 0

  const [debouncedVariation, setDebouncedVariation] = useDebouncedState(
    null,
    500,
  )

  // console.log("variables", variation?.variables)

  useEffect(() => {
    if (debouncedVariation) {
      console.log("saving variation")
      update(debouncedVariation)
    }
  }, [debouncedVariation])

  useEffect(() => {
    Object.keys(variables).forEach((key) => {
      if (!debouncedVariation?.variables[key]) setVariableValue(key, "")
    })
  }, [variables, debouncedVariation?.variables])

  const setVariableValue = (variable, value) => {
    const updatedVariables = { ...variation?.variables, [variable]: value }
    const updatedVariation = { ...variation, variables: updatedVariables }
    mutate(updatedVariation)
    setDebouncedVariation(updatedVariation)
  }

  const setIdealOutput = (idealOutput) => {
    const updatedVariation = { ...variation, idealOutput }
    mutate(updatedVariation)
    setDebouncedVariation(updatedVariation)
  }

  return (
    <Fieldset
      variant="filled"
      pos="relative"
      legend={hasVariables && `Variation ${i + 1}`}
    >
      <Stack>
        <PromptVariableEditor
          variables={variation?.variables}
          updateVariable={(variable, value) => {
            setVariableValue(variable, value)
          }}
        />

        <Textarea
          label="Ideal output (optional)"
          description="Useful for assessing the proximity of the LLM response to an anticipated output."
          required={false}
          autosize
          maxRows={6}
          minRows={3}
          value={variation?.idealOutput || ""}
          onChange={(e) => setIdealOutput(e.target.value)}
        />
      </Stack>
      {prompt?.variations?.length > 1 && (
        <ActionIcon
          onClick={async () => {
            onDelete()
            await remove()
          }}
          pos="absolute"
          top={-10}
          right={-10}
          color="red"
          variant="subtle"
        >
          <IconTrash size={16} />
        </ActionIcon>
      )}
    </Fieldset>
  )
}

function PromptTab({ promptId, onDelete }) {
  const {
    prompt,
    update,
    loading,
    remove,
    insertVariation,
    isInsertingVariation,
    mutate,
  } = useDatasetPrompt(promptId)

  const promptVariables = usePromptVariables(prompt?.messages)

  const [debouncedMessages, setDebouncedMessages] = useDebouncedState(null, 500)

  useEffect(() => {
    if (debouncedMessages) {
      console.log("saving")
      update({ messages: debouncedMessages })
    }
  }, [debouncedMessages])

  const hasVariables = Object.keys(promptVariables).length > 0

  if (loading) {
    return <Loader />
  }

  return (
    <Stack>
      <PromptEditor
        onChange={(value) => {
          mutate({ ...prompt, messages: value })
          setDebouncedMessages(value)
        }}
        value={prompt?.messages}
        isText={false}
      />
      {prompt?.variations?.map((variation, i) => (
        <PromptVariation
          key={i}
          i={i}
          variables={promptVariables}
          variationId={variation.id}
          onDelete={() => {
            mutate({
              ...prompt,
              variations: prompt.variations.filter(
                (v) => v.id !== variation.id,
              ),
            })
          }}
        />
      ))}
      {hasVariables && (
        <>
          <Text size="sm" c="dimmed">
            Experiment with various configurations in the prompt:
          </Text>
        </>
      )}
      {hasVariables && (
        <Button
          variant="outline"
          loading={isInsertingVariation}
          onClick={async () => {
            const variation = await insertVariation({ variables: {}, promptId })
            mutate({
              ...prompt,
              variations: [...prompt.variations, variation],
            })
          }}
        >
          Add variation
        </Button>
      )}

      <Button
        size="compact-sm"
        onClick={async () => {
          modals.openConfirmModal({
            title: "Please confirm your action",
            confirmProps: { color: "red" },
            children: (
              <Text size="sm">
                Are you sure you want to delete this prompt? This action cannot
                be undone and the prompt data will be lost forever.
              </Text>
            ),
            labels: { confirm: "Confirm", cancel: "Cancel" },

            onConfirm: async () => {
              onDelete()
              await remove()
            },
          })
        }}
        color="red"
        variant="subtle"
        w="fit-content"
      >
        Remove prompt
      </Button>
    </Stack>
  )
}

export default function NewDataset() {
  const router = useRouter()
  const pathname = usePathname()

  const [activePrompt, setActivePrompt] = useState<string | null>(null)

  const datasetId = router.query.id as string
  const { dataset, loading, insertPrompt, mutate, isInsertingPrompt } =
    useDataset(datasetId)

  const isEdit = pathname?.split("/")?.at(-1) !== "new"
  const title = isEdit ? "Dataset: " + dataset?.slug : "Create Dataset"

  useEffect(() => {
    if (
      (dataset?.prompts.length > 0 && !activePrompt) ||
      (activePrompt && !dataset?.prompts.find((p) => p.id === activePrompt))
    ) {
      setActivePrompt(dataset.prompts[0].id)
    }
  }, [dataset, activePrompt])

  if (loading) {
    return <Loader />
  }

  return (
    <Container>
      <Stack gap="lg">
        <Anchor
          href="#"
          onClick={(e) => {
            e.preventDefault()
            router.back()
          }}
        >
          ← Back
        </Anchor>
        <Stack>
          <Group align="center">
            <Title>{title}</Title>
            <Badge variant="light" color="violet">
              Alpha
            </Badge>
          </Group>
          <Text size="lg" mb="md">
            A dataset is a collection of prompts that you can use as a basis for
            evaluations.
          </Text>
        </Stack>

        <Tabs value={activePrompt} onChange={setActivePrompt} variant="pills">
          <Group justify="space-between" mb="lg" wrap="nowrap">
            <Tabs.List>
              {dataset?.prompts.map((prompt, i) => (
                <Tabs.Tab value={prompt.id} key={i}>
                  {`Prompt ${i + 1}`}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            <Button
              leftSection={<IconPlus size={12} />}
              variant="outline"
              loading={isInsertingPrompt}
              onClick={async () => {
                const prompt = await insertPrompt({ datasetId })
                mutate({
                  ...dataset,
                  prompts: [...dataset.prompts, prompt],
                })
                setActivePrompt(prompt.id)
              }}
              size="sm"
            >
              Add Prompt
            </Button>
          </Group>

          {dataset?.prompts.map((prompt, i) => (
            <Tabs.Panel key={i} value={prompt.id}>
              <PromptTab
                promptId={prompt.id}
                onDelete={() => {
                  mutate({
                    ...dataset,
                    prompts: dataset.prompts.filter((p) => p.id !== prompt.id),
                  })
                }}
              />
            </Tabs.Panel>
          ))}
        </Tabs>

        {/* <Button
          display="inline-block"
          ml="auto"
          loading={isInserting || isUpdating}
          onClick={() => saveDataset()}
        >
          Save Dataset
        </Button> */}
      </Stack>
    </Container>
  )
}
