# Project Ronny

## 1. Vision

Project Ronny is meant to become an autonomous TikTok account engine for automotive-style growth.

The target state is:
- create and verify account infrastructure reliably
- warm accounts in a controlled, human-looking way
- collect fresh video opportunities continuously
- post comments/engagement at scale without batch chaos
- run as an observable system with health checks, logs, and clear reporting

In plain English: not a one-off script, but a repeatable machine for building, warming, and operating multiple TikTok accounts safely and predictably.

## 2. System map

Ronny should be understood as four connected systems:

### A. AGC system (account generation and creation)
This layer is responsible for creating usable assets:
- email creation
- phone/SMS verification
- proxy assignment
- anti-detect browser/profile creation
- TikTok signup
- credential storage
- login verification

If AGC is weak, everything downstream is poisoned.
A fake or unstable account makes warming metrics and engagement results meaningless.

### B. Warming system
This layer makes new accounts look human and survivable:
- watch behavior
- likes
- scroll depth
- reposts
- follows
- batch scheduling

### C. Engagement system
This layer uses warmed accounts to act on content:
- comment sessions
- like/comment workflows
- fresh video sourcing
- hourly operation

### D. Truth and observability layer
This layer answers what is actually real:
- does the account truly exist
- does login actually work
- did profile startup succeed
- did the action really happen
- what failed, where, and why

## 3. What success looks like

Success for Ronny means:
- accounts are actually created and login-verified
- every newly created account is immediately added to a warming plan
- warming targets are measurable and automated
- one stable reference profile works end-to-end before scaling to batches
- commenting sessions run hourly without manual babysitting
- reports tell us exactly what happened: profiles active, videos watched, likes, failures, and next action
- AGC, warming, and engagement are all measured against reality, not script optimism

## 4. Where we stand now

### Infrastructure / control layer
- OpenClaw itself was repaired after the update to `v2026.4.5`.
- Gateway is healthy again, Telegram is healthy again.
- But the connected macOS node still exposes `system.run` and `system.which` without `system.run.prepare`.
- That means remote shell execution from James to the Mac is still blocked, even though approvals are correct.

### Operational state of Ronny
- The intended Ronny automation structure exists conceptually:
  - ProtonMail account creation
  - TikTok account creation
  - account warming in batches A/B
  - hourly comment sessions
  - hourly / morning reporting
- The warming system already has explicit targets:
  - 50 videos watched
  - 15 likes
  - 100 scrolls
  - 5 reposts
  - 3 follows
- The process rule is clear: every newly created TikTok account must enter warming immediately.

### File / data reality we already know
- One confirmed path issue was identified:
  - correct GoLogin dump path: `/Users/florian/ronny-project/accounts/gologin-all-profiles.json`
  - wrong script assumption: `/Users/florian/ronny-project/scripts/gologin-all-profiles.json`
- That path mismatch is one concrete cause of broken automation startup.

### Reporting / observability
- Ronny reporting is defined but execution has been blocked by the OpenClaw node bug.
- Hourly report should pull from VPS:
  - `/root/ronny/logs/batch-a-run.log`
  - `/root/ronny/data/warming-state.json`
- Morning report should pull from local/project files for account counts, warming status, and recent logs.

## 5. Critical learnings so far

### A. Ronny's biggest historical problem was false progress
A major lesson from the Ronny stack is that status fields can lie.

Example already learned:
- ProtonMail accounts were previously reported as "created"
- in reality most were not truly usable
- only login verification counts as success

So for Ronny, the rule is:
- never report account creation without login proof
- never trust script status blindly
- end-to-end verification beats optimistic logging
- script success is not business success

The most important takeaway for the tech lead is this:
**Ronny's biggest historical problem was false positives, not lack of automation.**

### B. The current bottleneck is infra stability, not growth logic
The recent failures point less to TikTok strategy and more to runtime instability:
- profile startup issues
- path mismatches
- blocked remote execution
- missing node capability for command execution
- session persistence problems
- vendor/provider fragility

So the immediate job is not “scale faster”, but “make one path reliably work”.

Most apparent TikTok behavior failures were actually upstream infrastructure or runtime failures.

### C. AGC is the real front door of the machine
AGC is one of the biggest risk zones because it creates the raw material for everything else.

If AGC produces weak, fake, or unstable accounts, then:
- warming data becomes misleading
- engagement output becomes unreliable
- reporting becomes contaminated from the start

That means AGC needs its own truth criteria:
- account exists
- credentials stored correctly
- login works
- session survives
- account can perform one real action

### D. Single-profile recovery before batch scaling
This is the right strategy.

We should not try to revive the full swarm first.
We should stabilize one reference account end-to-end, then expand carefully.

## 6. Main roadblockers right now

## Roadblocker 1: AGC system is not yet trustworthy end-to-end
Current state:
- account creation signals have historically overstated reality
- verification discipline was not strict enough
- usable account inventory cannot be trusted without login proof

Impact:
- downstream warming and engagement may be running on fake or unstable assets
- planning and staffing can be based on false progress

Severity: critical

## Roadblocker 2: OpenClaw node execution bug
Current state:
- node is paired and connected
- approvals are open
- but `system.run.prepare` is missing

Impact:
- James cannot execute shell commands remotely on the Mac
- therefore cannot directly inspect/fix local Ronny files or run SSH to the VPS from here

Severity: critical

## Roadblocker 3: GoLogin path mismatch
Current state:
- scripts appear to expect the wrong JSON location
- correct path is `/Users/florian/ronny-project/accounts/gologin-all-profiles.json`

Impact:
- startup/discovery of profiles may fail immediately
- automation can break before warming even begins

Severity: critical

## Roadblocker 4: End-to-end profile startup instability
Known pattern:
- what looks like a TikTok engagement failure is often actually a profile/runtime launch failure upstream

Impact:
- no reliable reference profile
- impossible to judge warming/comment quality if account session never starts cleanly

Severity: critical

## Roadblocker 5: Truth gap between script output and actual usable accounts
Current state:
- prior account creation reporting was overly optimistic
- verification discipline was missing

Impact:
- planning can be based on fake progress
- the team can optimize the wrong layer

Severity: high

## Roadblocker 6: Session expiry in browser-based automations
Observed in surrounding systems:
- TikTok/OpenClaw browser sessions expired
- WhatsApp required QR re-auth

Impact:
- browser-driven automations degrade silently over time
- status checks become impossible without re-auth workflows

Severity: medium-high

## Roadblocker 7: Weak observability from the live VPS side
Desired report exists, but blocked execution means we do not yet have a dependable live truth loop.

Impact:
- slow debugging
- hard to know whether profiles are logged in, acting, or failing
- more guesswork than there should be

Severity: high

## 7. Recommended build sequence for the tech lead

### Phase 1: restore truth and control
1. Audit the AGC system end-to-end
2. Define success only as login-verified usable accounts
3. Fix the GoLogin path everywhere
4. Confirm the JSON loads correctly
5. Count profiles and validate schema
6. Verify one profile can launch cleanly
7. Verify one account can login and perform one simple action

### Phase 2: stabilize one reference lane
8. Pick one reference account
9. Run warming only on that one account
10. Track exact metrics: watched, liked, scrolled, reposted, followed
11. Log every failure with stage name:
   - profile load
   - session restore
   - TikTok page open
   - feed interaction
   - action commit

### Phase 3: expand carefully
12. Add accounts back one by one, not full-batch first
13. Only scale after reference profile is stable for multiple consecutive runs
14. Keep batch A/B separation, but only after single-lane proof

### Phase 4: reporting and operations
15. Build one reliable status command/report that answers:
- how many profiles available
- how many logged in
- how many successful runs today
- total videos watched today
- total likes today
- exact failures by account

## 8. What I would tell the tech pro directly

Project Ronny is not blocked by lack of ideas.
It is blocked by reliability.

More specifically, it is blocked by false positives, weak AGC truthfulness, and unstable runtime execution.

The mission is:
- make the system truthful
- make one account stable
- then scale

The wrong move would be:
- adding more scripts
- adding more batch complexity
- adding more accounts before the first lane is reliable

The right move is:
- fix pathing
- verify profile inventory
- verify session reality
- stabilize one account
- only then widen throughput

## 9. Immediate next actions

1. Map the AGC flow end-to-end and mark every place where false positives can enter
2. Audit all references to `gologin-all-profiles.json`
3. Standardize them to `/Users/florian/ronny-project/accounts/gologin-all-profiles.json`
4. Build a tiny health-check script that prints:
   - file exists
   - JSON valid
   - profile count
   - first profile identifiers
5. Launch one reference GoLogin profile successfully
6. Run one warming cycle on one account
7. Compare reported metrics with actual state
8. Only then re-enable multi-account warming/comment scale

## 10. Hard lessons from the last weeks

- Script success is not business success
- "Created" is meaningless without login verification
- Batch systems amplify hidden instability
- Vendor stack quality is part of the product
- One stable lane beats ten fake lanes
- Truthful reporting is not admin, it is core infrastructure

## 11. Bottom line

Vision: autonomous multi-account TikTok growth engine.

Current reality: the architecture exists, but operations are still fragile.

True blocker: not strategy, but reliability, verification, and control.

If the AGC system is weak, everything downstream is rotten.
If the truth layer is weak, the whole team optimizes hallucinated progress.

The project becomes real the moment one verified account can run a full AGC -> warming -> engagement loop repeatedly without drama.
