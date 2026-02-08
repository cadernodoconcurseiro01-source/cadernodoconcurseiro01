
# Plano de Correção de Telas Brancas e Funcionalidades Faltantes

## Problemas Identificados

### 1. Tela Branca ao Adicionar Baralhos e Flashcards
**Causa**: As funções `addDeck` e `addFlashcard` nos hooks retornam `.mutate` diretamente. Quando ocorre um erro assíncrono dentro do handler, o erro não tratado causa crash.

**Arquivos afetados**:
- `src/pages/FlashcardsNew.tsx` (linhas 75-96, 227)
- `src/hooks/useFlashcardDecks.ts`
- `src/components/AddFlashcardDialogNew.tsx`

### 2. Tela Branca em Questões e Simulados
**Causa**: Similar ao problema anterior - erros assíncronos não tratados nos handlers de submit. Além disso, possível crash em componentes `Select` com valor vazio.

**Arquivos afetados**:
- `src/pages/Questions.tsx`
- `src/pages/Simulados.tsx`
- `src/components/AddDailyQuestionsDialog.tsx`
- `src/components/AddSimuladoDialog.tsx`

### 3. Tela Branca ao Selecionar Tipo de Plano no Concurso
**Causa**: O componente `AddContestDialog.tsx` usa `Select` com valores que podem causar erro quando o estado não está inicializado corretamente.

**Arquivos afetados**:
- `src/components/AddContestDialog.tsx` (linha 48-53)

### 4. Adicionar Matérias ao Concurso
**Funcionalidade faltante**: Ao clicar em um concurso, deve ser possível adicionar matérias vinculadas a ele. Atualmente não existe essa funcionalidade.

**Necessário criar**:
- Página de detalhes do concurso (`src/pages/ContestDetails.tsx`)
- Dialog para adicionar matérias ao concurso
- Navegação do card de concurso para a página de detalhes

---

## Solução Proposta

### Fase 1: Correção de Crashes (Telas Brancas)

#### 1.1 Adicionar Handler Global de Erros (App.tsx)
Adicionar um listener para `unhandledrejection` que previne crash total e mostra toast de erro.

```text
Arquivo: src/App.tsx
Mudança: Adicionar useEffect com window.addEventListener("unhandledrejection")
```

#### 1.2 Corrigir AddFlashcardDialogNew
Envolver o `onAdd` em try/catch no handleSubmit.

```text
Arquivo: src/components/AddFlashcardDialogNew.tsx
Linhas: 29-37
Mudança: Adicionar try/catch e toast.error no handleSubmit
```

#### 1.3 Corrigir FlashcardsNew.tsx - handleAddDeck
O handler já tem try/catch, mas precisa verificar se os dados estão corretos antes de chamar.

```text
Arquivo: src/pages/FlashcardsNew.tsx
Linhas: 75-96
Mudança: Adicionar validação mais robusta e garantir que addDeck seja chamado corretamente
```

#### 1.4 Corrigir AddDailyQuestionsDialog
Envolver o `onAdd` em try/catch.

```text
Arquivo: src/components/AddDailyQuestionsDialog.tsx
Linhas: 41-56
Mudança: Adicionar try/catch no handleSubmit
```

#### 1.5 Corrigir AddSimuladoDialog
Envolver o `onAdd` e `onUpdate` em try/catch.

```text
Arquivo: src/components/AddSimuladoDialog.tsx
Linhas: 92-115
Mudança: Adicionar try/catch no handleSubmit
```

#### 1.6 Corrigir AddContestDialog
O problema pode estar no Select do `study_plan_type`. Garantir valor inicial e envolver em try/catch.

```text
Arquivo: src/components/AddContestDialog.tsx
Linhas: 45-54, 70-81
Mudança: 
- Adicionar try/catch no handleSubmit
- Garantir que o Select sempre tenha um valor válido
```

---

### Fase 2: Funcionalidade de Matérias por Concurso

#### 2.1 Criar Página de Detalhes do Concurso
Nova página para visualizar concurso e suas matérias vinculadas.

```text
Novo arquivo: src/pages/ContestDetails.tsx
Funcionalidades:
- Exibir informações do concurso
- Listar matérias vinculadas (filtradas por contest_id)
- Botão para adicionar nova matéria ao concurso
- Tabela com sequência de estudos e opção de marcar como concluído
```

#### 2.2 Atualizar AddSubjectDialogNew
Adicionar campo para selecionar concurso (opcional ou fixo quando dentro do contexto de um concurso).

```text
Arquivo: src/components/AddSubjectDialogNew.tsx
Mudanças:
- Adicionar prop opcional contestId
- Se contestId fornecido, vincular automaticamente a matéria ao concurso
- Usar addSubjectWithContest do useSubjects
```

#### 2.3 Tornar Concurso Clicável
Atualizar ContestList para navegar para a página de detalhes ao clicar.

```text
Arquivo: src/components/ContestList.tsx
Mudança: Adicionar onClick no Card que navega para /contests/:id
```

#### 2.4 Adicionar Rota
```text
Arquivo: src/App.tsx
Mudança: Adicionar Route path="/contests/:id" element={<ContestDetails />}
```

---

### Fase 3: Tabela de Sequência com Checklist

#### 3.1 Criar Componente de Tabela de Estudos
Exibir a sequência de matérias do ciclo/plano com checkbox para marcar conclusão.

```text
Novo arquivo: src/components/StudySequenceTable.tsx
Funcionalidades:
- Exibir todas as matérias do concurso em ordem
- Checkbox para marcar cada sessão como concluída
- Texto riscado quando concluído
- Armazenar estado de conclusão (pode usar localStorage ou nova tabela no DB)
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Modificar - Handler global de erros + nova rota |
| `src/components/AddFlashcardDialogNew.tsx` | Modificar - try/catch |
| `src/pages/FlashcardsNew.tsx` | Modificar - Melhorar handler |
| `src/components/AddDailyQuestionsDialog.tsx` | Modificar - try/catch |
| `src/components/AddSimuladoDialog.tsx` | Modificar - try/catch |
| `src/components/AddContestDialog.tsx` | Modificar - try/catch + validação |
| `src/components/ContestList.tsx` | Modificar - Navegação para detalhes |
| `src/components/AddSubjectDialogNew.tsx` | Modificar - Suporte a contestId |
| `src/pages/ContestDetails.tsx` | Criar - Página de detalhes |
| `src/components/StudySequenceTable.tsx` | Criar - Tabela com checklist |

---

## Detalhes Técnicos

### Padrão de Try/Catch para Handlers Assíncronos

Todas as funções de submit que chamam mutations do React Query serão atualizadas para seguir este padrão:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Validações
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    // Chamar mutation
    await onAdd(dados);
    
    // Limpar e fechar
    resetForm();
    setOpen(false);
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Ocorreu um erro. Tente novamente.');
  }
};
```

### Navegação para Detalhes do Concurso

O ContestList será atualizado para que o card seja clicável:

```typescript
<Card 
  onClick={() => navigate(`/contests/${contest.id}`)}
  className="cursor-pointer hover:shadow-lg transition-shadow"
>
```

### Estrutura da Página ContestDetails

A página mostrará:
1. Cabeçalho com nome do concurso e info do ciclo/plano
2. Lista de matérias vinculadas com botão de adicionar
3. Tabela de sequência de estudos com checkboxes

---

## Ordem de Implementação

1. Corrigir todos os crashes (Fase 1) - Prioridade Alta
2. Criar página de detalhes do concurso (Fase 2) - Prioridade Alta
3. Adicionar tabela de sequência (Fase 3) - Prioridade Média
