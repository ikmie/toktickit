# Lab 04 - GitHub Issues & Kanban Board Guide

This document lists all **Lab 4 Feature Issues** created on `ikmie/toktickit` according to **Section 11 of the Lab 4 Handout** and details how to place them in the **Ready** column of your GitHub Project Kanban board ([https://github.com/users/ikmie/projects/1](https://github.com/users/ikmie/projects/1)).

---

## 1. Created Lab 4 GitHub Issues Index

All 7 Lab 4 issues have been published to GitHub:

| Issue # | Issue Title | Target Branch | Handout Milestone | Initial Status | Final Status |
|:---:|:---|:---|:---|:---:|:---:|
| **[#33](https://github.com/ikmie/toktickit/issues/33)** | `[Lab 4] Sprint 4 Engineering Specification & Contracts` | `feature/lab4-1-docs-contract` | Sprint 4 Engineering Contract | `Ready` | `Done` |
| **[#34](https://github.com/ikmie/toktickit/issues/34)** | `[Lab 4] Database Schema Evolution & Idempotent Seed` | `feature/lab4-2-database-seed` | Actions Taken Foundation (DB/Seed) | `Ready` | `Done` |
| **[#35](https://github.com/ikmie/toktickit/issues/35)** | `[Lab 4] Actions Taken REST API & Resolution Gate` | `feature/lab4-3-actions-taken-backend` | Actions Taken Backend & Gate | `Ready` | `Done` |
| **[#36](https://github.com/ikmie/toktickit/issues/36)** | `[Lab 4] Role Dashboard Backend APIs & Metrics` | `feature/lab4-4-dashboards-backend` | Role Dashboards Backend | `Ready` | `Done` |
| **[#37](https://github.com/ikmie/toktickit/issues/37)** | `[Lab 4] Actions Taken & Role Dashboards UI` | `feature/lab4-5-frontend-ui` | Actions Taken & Dashboards UI | `Ready` | `Done` |
| **[#38](https://github.com/ikmie/toktickit/issues/38)** | `[Lab 4] E2E Verification, Hardening & Zen Green Polish` | `feature/lab4-6-e2e-hardening` | Final Hardening & E2E Tests | `Ready` | `Done` |
| **[#39](https://github.com/ikmie/toktickit/issues/39)** | `[Lab 4] Release Integration: Staging to Main` | `lab4-staging` &rarr; `main` | Release Integration | `Ready` | `Done` |

---

## 2. How to Add Issues to the "Ready" Column in GitHub Projects

To make all Lab 4 feature issues appear in the **Ready** column of your Kanban board:

1. Open your GitHub Project: **[https://github.com/users/ikmie/projects/1](https://github.com/users/ikmie/projects/1)**.
2. In the board view, locate the **"Ready"** column.
3. At the bottom of the **Ready** column, click **`+ Add item`** (or press the keyboard shortcut `+` when hovering over the column).
4. Type **`#`** and select each of the 7 Lab 4 issues:
   - Type `#33` and select `[Lab 4] Sprint 4 Engineering Specification & Contracts`
   - Type `#34` and select `[Lab 4] Database Schema Evolution & Idempotent Seed`
   - Type `#35` and select `[Lab 4] Actions Taken REST API & Resolution Gate`
   - Type `#36` and select `[Lab 4] Role Dashboard Backend APIs & Metrics`
   - Type `#37` and select `[Lab 4] Actions Taken & Role Dashboards UI`
   - Type `#38` and select `[Lab 4] E2E Verification, Hardening & Zen Green Polish`
   - Type `#39` and select `[Lab 4] Release Integration: Staging to Main`
5. All 7 cards will now appear clearly in your **Ready** column!

---

## 3. Kanban Workflow Lifecycle for Submission Evidence

According to **Section 14 (Answer Part 1)** of the Lab 4 handout:

> *"Commit-history evidence showing feature branches merged into lab4-staging and then main; final GitHub Project/Kanban with all Issues in Done..."*

### Lifecycle Steps:
1. **Ready (Planning State)**:
   - All 7 issues start in the **`Ready`** column before implementation begins.
   - *Tip:* Capture a screenshot here if you wish to document the initial planning state.
2. **In Progress / In Review (Implementation State)**:
   - As each feature branch is actively worked on, its card moves to **`In Progress`**.
   - When a Pull Request is submitted for peer review by **Wichitchai Suwanno (`SinghLemonH`)**, it moves to **`In Review`**.
3. **Done (Completed State)**:
   - Once approved and merged into `lab4-staging` and `main`, move the issue card to **`Done`** (or close the issue).
   - In the final project state, all Lab 4 issues are in the **`Done`** column, matching the final submission report.

---

## 4. Automation Script

To re-run or inspect the issue creation automation script:

```bash
node scripts/create-lab4-issues.mjs [GITHUB_TOKEN]
```
