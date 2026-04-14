# PROJECT RONNY, TECH HANDOFF

## 1. What Ronny is

Project Ronny is an automation system for creating, warming, and operating TikTok accounts.

The intended end state is:
- accounts are created reliably
- accounts are verified as truly usable
- new accounts enter warming automatically
- warmed accounts perform engagement actions reliably
- the whole system is observable and measurable

This is not mainly a growth-strategy problem.
It is a systems-reliability problem.

## 2. Core architecture

Ronny has four layers.

### A. AGC layer
AGC = account generation and creation.

This includes:
- email creation
- phone or SMS verification
- proxy assignment
- anti-detect browser profile creation
- TikTok signup
- credential storage
- login verification

If AGC is weak, everything downstream is invalid.

### B. Warming layer
This includes:
- watch actions
- likes
- scrolls
- reposts
- follows
- batch scheduling

Current target per account:
- 50 videos watched
- 15 likes
- 100 scrolls
- 5 reposts
- 3 follows

### C. Engagement layer
This includes:
- comment sessions
- like and comment workflows
- fresh video sourcing
- hourly operation

### D. Truth and observability layer
This layer answers:
- does the account really exist
- does login actually work
- did the profile actually launch
- did the action actually happen
- where exactly did failure occur

Without this layer, the team will optimize fake progress.

## 3. Current diagnosis

The biggest historical problem in Ronny was false progress.

Meaning:
- scripts said created, but accounts were not truly usable
- logs suggested movement, but the real asset was broken
- downstream automation looked alive while upstream systems had already failed

The central lesson is simple:
**reported success is meaningless unless the account is login-verified and usable.**

## 4. Main roadblockers

### 1. AGC is not yet trustworthy end to end
Problems:
- creation status has overstated reality
- verification discipline was too weak
- usable inventory cannot be trusted without proof

Required truth standard:
- account exists
- credentials are saved correctly
- login works
- session survives
- account can perform at least one real action

### 2. Remote execution on the Mac is still blocked
Current issue:
- the connected macOS node exposes `system.run` and `system.which`
- but does not expose `system.run.prepare`

Impact:
- local Ronny commands cannot be executed remotely through James
- debugging and repair are slowed down significantly

### 3. GoLogin path mismatch breaks startup reliability
Confirmed mismatch:
- correct path: `/Users/florian/ronny-project/accounts/gologin-all-profiles.json`
- wrong assumed path: `/Users/florian/ronny-project/scripts/gologin-all-profiles.json`

Impact:
- scripts may fail before profile startup
- automation can break before warming even begins

### 4. Profile startup instability contaminates everything downstream
Pattern:
- what looks like a TikTok behavior issue is often a profile-launch or runtime issue upstream

Impact:
- no stable reference lane
- impossible to evaluate warming or engagement honestly

### 5. Observability is still too weak
Impact:
- too much guessing
- too little stage-by-stage truth
- slow debugging

## 5. What the builder should believe

Do not assume Ronny is blocked by missing scripts.
Assume it is blocked by weak truth, weak verification, and unstable execution.

Do not scale first.
Do not add complexity first.
Do not trust status labels first.

First make one lane real.
Then scale.

## 6. Correct success criteria

Ronny is only working if all of the following are true:
- one account can be created and verified
- one profile can launch repeatedly without drama
- one account can complete warming actions and those actions are logged correctly
- one account can perform engagement actions successfully
- failures are attributed to the exact failing stage

## 7. Recommended build order

### Phase 1, restore truth
1. Audit the AGC flow end to end.
2. Mark every place where false positives can enter.
3. Redefine success as login-verified usable accounts only.
4. Remove or downgrade any misleading status labels.

### Phase 2, restore startup reliability
5. Fix every reference to `gologin-all-profiles.json`.
6. Add a health-check that confirms:
   - file exists
   - JSON is valid
   - profile count is readable
   - one profile can be selected cleanly
7. Verify one profile can actually launch.

### Phase 3, restore one real lane
8. Pick one reference account.
9. Run warming only on that account.
10. Track exact counts for:
   - watched
   - liked
   - scrolled
   - reposted
   - followed
11. Verify reported actions against actual state.

### Phase 4, restore engagement
12. Run one engagement session on the same reference account.
13. Confirm that the account can source content and execute actions successfully.
14. Log every failure by exact stage.

### Phase 5, scale slowly
15. Add accounts back one by one.
16. Only return to batch operation after repeated stable runs.

## 8. Minimum observability the builder should add

Ronny needs one reliable status output that answers:
- how many accounts are truly verified
- how many profiles can actually start
- how many warming runs succeeded today
- how many engagement runs succeeded today
- what failed, by account and by stage

Recommended stages:
- AGC creation
- credential save
- login test
- profile launch
- session restore
- TikTok open
- feed interaction
- action commit
- result verification

## 9. Hard lessons from the last weeks

- Created does not mean usable.
- Script success does not mean system success.
- Batch systems amplify hidden instability.
- AGC is the front door, if it is weak everything after it is garbage.
- Most apparent TikTok failures were actually upstream infrastructure failures.
- One stable lane is worth more than ten fake lanes.
- Truthful reporting is core infrastructure, not admin overhead.

## 10. Bottom line

Project Ronny is a reliability project.

The real sequence is:
**AGC -> warming -> engagement -> observability**

If AGC is weak, the assets are fake.
If observability is weak, progress is fake.

The project becomes real when one verified account can complete the full loop repeatedly and truthfully.