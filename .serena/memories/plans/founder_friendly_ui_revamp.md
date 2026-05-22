# Founder-Friendly UI Revamp Plan

Date: 2026-05-23

## Context
User wants Paperclip revamped so non-technical founders can run an AI company without feeling like they are using a technical control-plane/devtool. Technical functionality must remain available, but separated into Developer Settings / Advanced Mode.

This plan was created after reviewing:
- `doc/GOAL.md`
- `doc/PRODUCT.md`
- `doc/SPEC-implementation.md`
- UI architecture via `ui/src/App.tsx`, `Layout`, `Sidebar`, `OnboardingWizard`, `AgentConfigForm`, `Dashboard`, `Issues`, `IssueDetail`, `Agents`, `AgentDetail`, settings pages.
- Current UX friction from recent Railway/ModelArk setup debugging.

## Product Alignment
Docs already support this direction:
- Time-to-first-success under 5 minutes.
- Board-level abstraction should win.
- Progressive disclosure: summary first, raw logs/details later.
- Do not force users to understand provider/API-key plumbing.
- Do not lead with raw bash logs/transcripts.

## Core Diagnosis
Paperclip is powerful but currently feels like a technical operator/control-plane UI, not a founder product.

Major friction:
- Founder sees technical terms too early: adapter, codex_local, heartbeat, modelProfiles, cheap model, runtime, workspace, env, secret_ref, provider, base_url, session, raw transcript.
- Onboarding mixes business setup with CLI/adapter debugging.
- Agent config feels like DevOps panel rather than “hire AI employee”.
- Dashboard answers “what is running?” more than “what business progress happened and what needs my decision?”.
- Errors are too raw: 401, model not found, paperclip_unavailable, API URLs.
- Settings surface too many advanced concepts: secrets, environments, plugins, adapters, cloud upstream, heartbeats, experimental.

## Target Mental Model
Default UI should be Founder Mode:
- Home
- Work
- Team
- Decisions
- Spend
- Company

Technical UI moves to Developer Settings / Advanced Mode:
- AI Providers
- Adapters
- Secrets
- Environments
- Plugins
- Runtime Logs
- Heartbeats
- Experimental

Founder Mode should answer:
1. What is my AI company working on?
2. Who is working and what are they doing?
3. What needs my decision?
4. What outputs are ready?
5. What is it costing and is it safe?

## Terminology Shifts
- Agent -> AI Employee / Team Member
- Adapter -> AI Provider / AI Tool
- Heartbeat -> Check-in / Work Session
- Issue -> Task / Work Item
- Run -> Work Session
- Model Profile / Cheap Model -> Cost-Saving Mode
- Environment Variables -> Credentials
- Workspace -> Work Area
- Runtime Logs -> Technical Logs
- Prompt Template -> Operating Instructions
- Skills -> Capabilities
- Plugin -> Integration
- Adapter Manager -> Developer Integrations

## Founder Flow
1. Create Company
   - “What are you building?”
   - “What is your 30-day goal?”
   - “What should success look like?”

2. Connect AI Provider
   - Cards: OpenAI, ModelArk, Anthropic, Advanced/Custom.
   - Founder sees only API key and recommended model.
   - Advanced fields hidden.

3. Hire CEO
   - Default name: CEO.
   - Role: runs strategy and delegates work.
   - Provider prefilled.
   - No adapter terminology.

4. Choose Starting Team
   - CEO only.
   - CEO + Engineer.
   - CEO + CMO.
   - Startup team: CEO, CTO, CMO, Engineer.

5. Give First Mission
   - Example missions: build GTM plan, create MVP landing page, research competitors, plan first customer acquisition experiments.

6. Launch Company
   - Checklist: company created, provider connected, CEO hired, first mission assigned.
   - CTA: Start AI Company.

## Page Revamp Plan

### 1. Home / Command Center
Files:
- `ui/src/pages/Dashboard.tsx`
- `ui/src/components/ActiveAgentsPanel.tsx`
- `ui/src/components/MetricCard.tsx`

Goal: executive overview.
Sections:
- Needs Your Attention
- Active Work
- Completed Outputs
- Team Health
- Spend This Month
- Recommended Next Step

Move charts lower or behind advanced analytics.

### 2. Work Page
Files:
- `ui/src/pages/Issues.tsx`
- `ui/src/components/IssuesList.tsx`
- `ui/src/components/IssueRow.tsx`

Change from issue tracker to founder work queue.
Lanes:
- Planned
- Working
- Needs Review
- Blocked
- Done

Copy:
- New Issue -> Assign Work
- Assignee -> Owner

### 3. Task Room
Files:
- `ui/src/pages/IssueDetail.tsx`
- `ui/src/components/IssueChatThread.tsx`
- `ui/src/components/IssueRunLedger.tsx`
- `ui/src/components/IssueProperties.tsx`

Default view:
- What this task is for.
- Who owns it.
- Current status.
- Latest update.
- Output/files/docs.
- Reply box.

Move raw details to:
- Activity
- Technical Logs
- Raw Transcript

### 4. Team Page
Files:
- `ui/src/pages/Agents.tsx`
- `ui/src/pages/AgentDetail.tsx`
- `ui/src/pages/OrgChart.tsx`

Founder view:
- AI employee cards.
- Role.
- Current work.
- Status.
- Last update.
- Spend.
- Manager/reporting line.

Agent detail tabs:
- Overview
- Work
- Instructions
- Budget
- Advanced

Move Configuration, Runs, Session, Reset Sessions, Copy Agent ID to Advanced.

### 5. Hire AI Employee Flow
Files:
- `ui/src/components/NewAgentDialog.tsx`
- `ui/src/pages/NewAgent.tsx`
- `ui/src/components/AgentConfigForm.tsx`

Default path:
- “Describe who you want to hire.”
- “CEO can create this role for you.”
- Manual setup collapsed.

Advanced path:
- Existing AgentConfigForm.

Do not remove technical form; wrap behind Advanced.

### 6. AI Provider Setup
Likely new files:
- `ui/src/pages/AiProviderSetup.tsx` or shared provider setup components.

Integrate with:
- `AgentConfigForm`
- `ui/src/adapters/*/config-fields.tsx`

Founder provider cards:
- OpenAI
- ModelArk
- Anthropic
- Local CLI
- Custom

For ModelArk:
- Label: BytePlus ModelArk.
- API key: ARK_API_KEY.
- Default model: deepseek-v3-2-251201.
- Hide base_url, wire_api, provider ID unless Advanced.
- Cheap model/cost-saving mode must be disabled or normalized unless compatible.

### 7. Decisions Page
Files:
- `ui/src/pages/Inbox.tsx`
- `ui/src/pages/Approvals.tsx`
- `ui/src/pages/ApprovalDetail.tsx`

Unify mental model:
- Approvals
- Blocked Work
- Needs Review
- Failed Runs That Need Help

Founder copy:
- “Your CEO needs a decision.”
- “Approve hiring CMO.”
- “Review GTM plan.”
- “Fix AI provider connection.”

### 8. Settings Split
Files:
- `ui/src/components/Sidebar.tsx`
- `ui/src/components/CompanySettingsSidebar.tsx`
- `ui/src/components/InstanceSidebar.tsx`
- `ui/src/pages/AdapterManager.tsx`
- `ui/src/pages/Secrets.tsx`
- `ui/src/pages/CompanyEnvironments.tsx`

New Company Settings:
- Profile
- Team Access
- Spend Limits
- Integrations

New Developer Settings:
- AI Providers
- Adapters
- Secrets
- Environments
- Plugins
- Heartbeats
- Experimental

## Error UX Plan
Create friendly error translation layer.

Examples:
- OpenAI 401 -> “Your OpenAI key is invalid or belongs to another provider.” Actions: Update OpenAI key / Switch to ModelArk.
- ModelArk model not found -> “ModelArk does not support this model. Use deepseek-v3-2-251201.”
- paperclip_unavailable -> “Paperclip is still starting or crashed.” Action: Check Railway memory/logs.
- Missing ARK_API_KEY -> “ModelArk needs an API key before agents can work.” Action: Add ARK_API_KEY.

## Design Direction
Aesthetic: Founder Command Center, not devtool terminal.

Feel:
- executive cockpit
- warm dark surface
- clear status cards
- plain-language task rooms
- “company is alive” feeling
- technical detail available but secondary

Conceptual surfaces:
- Home = AI company operating room.
- Team = employee roster.
- Work = mission board.
- Decisions = boardroom agenda.
- Developer Settings = dense technical UI is acceptable.

## Implementation Phases

### Phase 1: Language & IA
Files:
- `Sidebar.tsx`
- `MobileBottomNav.tsx`
- `CompanySettingsSidebar.tsx`
- `InstanceSidebar.tsx`
- shared labels/constants

Tasks:
- Rename nav labels.
- Add Developer Settings grouping.
- Hide technical nav from primary founder sidebar.
- Keep routes unchanged to reduce risk.

### Phase 2: Founder Dashboard
Files:
- `Dashboard.tsx`
- `ActiveAgentsPanel.tsx`
- `MetricCard.tsx`

Tasks:
- Reorder dashboard around attention, active work, outputs, spend.
- Move charts lower.
- Add founder next-step cards.
- Improve empty states.

### Phase 3: Onboarding Wizard
Files:
- `OnboardingWizard.tsx`
- possible new provider setup components

Tasks:
- Business-first company creation.
- Provider setup wizard.
- CEO hire with default presets.
- First mission creation.
- Advanced connection test details collapsed.

### Phase 4: Agent Hiring Revamp
Files:
- `NewAgentDialog.tsx`
- `NewAgent.tsx`
- `AgentConfigForm.tsx`
- adapter config fields

Tasks:
- Default guided hire AI employee flow.
- Manual/advanced config behind toggle.
- Provider preset mapping.
- Hide cheap model by default.
- Disable/normalize cheap model automatically for ModelArk unless compatible.

### Phase 5: Work & Task Room
Files:
- `Issues.tsx`
- `IssuesList.tsx`
- `IssueRow.tsx`
- `IssueDetail.tsx`
- `IssueProperties.tsx`
- `IssueRunLedger.tsx`

Tasks:
- Rename issue surfaces to work/task.
- Create simpler task detail summary.
- Put outputs and latest update first.
- Move raw activity/logs into Technical tab.

### Phase 6: Decision Center & Error Translation
Files:
- `Inbox.tsx`
- `Approvals.tsx`
- `ApprovalDetail.tsx`
- run/error display components
- likely shared `friendly-errors.ts`

Tasks:
- Unified Decisions page.
- Friendly error mapping.
- Clear action buttons.

### Phase 7: Developer Settings
Files:
- `AdapterManager.tsx`
- `Secrets.tsx`
- `CompanyEnvironments.tsx`
- `InstanceExperimentalSettings.tsx`

Tasks:
- Keep technical power.
- Reorganize under developer mode.
- Add “For advanced setup only” warnings.
- Preserve existing functionality.

## Recommended First Slice
Start with:
1. Sidebar/IA rename and Developer Settings separation.
2. Dashboard founder command center.
3. Agent config simple/advanced split.
4. ModelArk-safe provider/cheap model defaults.

This gives immediate founder-friendly impact while preserving the technical core.

## Validation Plan
- `pnpm --filter @paperclipai/ui typecheck`
- targeted UI tests:
  - `pnpm exec vitest run ui/src/pages/Dashboard.test.tsx`
  - `pnpm exec vitest run ui/src/pages/Agents.test.tsx`
  - `pnpm exec vitest run ui/src/pages/Issues.test.tsx`
  - `pnpm exec vitest run ui/src/pages/IssueDetail.test.tsx`
- manual smoke:
  - first company creation
  - provider setup ModelArk
  - hire CEO
  - assign first mission
  - run agent
  - review output
  - view Developer Settings
- browser checks:
  - desktop
  - mobile
  - no-company first run
  - existing company with existing technical config

## Risks
- Very broad; do not do as one giant PR if avoidable.
- Preserve routes and backend contracts where possible.
- Technical users must retain current controls under Advanced/Developer Settings.
- Avoid losing external adapter/plugin extensibility.
