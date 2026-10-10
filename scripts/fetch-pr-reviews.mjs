import { execSync } from 'node:child_process';

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n' }).toString();
    const match = creds.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {}
  return null;
}

const token = getGitHubToken();
if (!token) {
  console.error('Error: GitHub token not found');
  process.exit(1);
}

const prNumbers = [40, 41, 42, 43, 44, 45];

async function checkReviews() {
  for (const num of prNumbers) {
    const prRes = await fetch(`https://api.github.com/repos/ikmie/toktickit/pulls/${num}`, {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'TokTickIT' }
    });
    const pr = await prRes.json();

    const reviewsRes = await fetch(`https://api.github.com/repos/ikmie/toktickit/pulls/${num}/reviews`, {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'TokTickIT' }
    });
    const reviews = await reviewsRes.json();

    const commentsRes = await fetch(`https://api.github.com/repos/ikmie/toktickit/issues/${num}/comments`, {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'TokTickIT' }
    });
    const comments = await commentsRes.json();

    console.log(`=== PR #${num}: ${pr.title} ===`);
    console.log(`State: ${pr.state}, Merged: ${pr.merged}, Merged At: ${pr.merged_at}`);
    console.log('Reviews:', reviews.map(r => ({ user: r.user?.login, state: r.state, body: r.body, submitted_at: r.submitted_at })));
    console.log('Comments:', comments.map(c => ({ user: c.user?.login, body: c.body, created_at: c.created_at })));
    console.log('');
  }
}

checkReviews().catch(console.error);
