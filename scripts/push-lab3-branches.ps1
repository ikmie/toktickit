# ==============================================================================
# Lab 3: Push Feature Branches to GitHub for Collaborator Review
# ==============================================================================
# Reviewer: Wichitchai Suwanno (Student ID: 67070503439, GitHub: SinghLemonH)
# Repository: https://github.com/ikmie/toktickit
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Pushing Lab 3 Feature Branches to GitHub..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Push base commit for lab3-staging (clean pre-Lab-3 base)
Write-Host "`n[1/8] Pushing clean base for lab3-staging..." -ForegroundColor Yellow
git push origin e42e467:refs/heads/lab3-staging --force

# 2. Push all 7 feature branches
$branches = @(
    "feature/lab3-1-docs-contract",
    "feature/lab3-2-database-seed",
    "feature/lab3-3-auth-foundation",
    "feature/lab3-4-requester-regression",
    "feature/lab3-5-it-staff-tickets",
    "feature/lab3-6-admin-user-management",
    "feature/lab3-7-e2e-artifacts"
)

$i = 2
foreach ($b in $branches) {
    Write-Host "`n[$i/8] Pushing branch $b..." -ForegroundColor Yellow
    git push -u origin $b
    $i++
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  All branches pushed successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "You can now open and approve the Pull Requests on GitHub.`n" -ForegroundColor White
