import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const blogPosts = {
  'budget-tracking-guide': {
    title: 'The Ultimate Guide to Budget Tracking: How to Take Control of Your Finances',
    date: '2024-03-24',
    readTime: '8 min read',
    content: `
      <h2>Introduction</h2>
      <p>Managing personal finances can feel overwhelming, but having a clear budget tracking system in place can make a world of difference. With the right tools and strategies, you can take full control of your income, expenses, and savings goals. In this guide, we'll walk you through everything you need to know about budget tracking and how Opsia.io can help simplify the process.</p>

      <h2>Why Budget Tracking is Essential</h2>
      <p>Budget tracking allows you to:</p>
      <ul>
        <li>Gain a clear picture of where your money is going</li>
        <li>Set and achieve financial goals</li>
        <li>Avoid unnecessary debt and overspending</li>
        <li>Save for future expenses and emergencies</li>
      </ul>

      <h2>Step-by-Step Guide to Setting Up Your Budget</h2>
      
      <h3>1. Assess Your Income and Expenses</h3>
      <p>List all sources of income and categorize your expenses into fixed (rent, utilities) and variable (entertainment, dining out) costs.</p>

      <h3>2. Set Financial Goals</h3>
      <p>Determine short-term goals (paying off credit card debt) and long-term goals (buying a house, retirement savings).</p>

      <h3>3. Choose a Budgeting Method</h3>
      <p>Popular methods include:</p>
      <ul>
        <li>50/30/20 Rule: 50% needs, 30% wants, 20% savings</li>
        <li>Zero-Based Budgeting: Assign every dollar a purpose</li>
        <li>Envelope System: Allocate cash for different spending categories</li>
      </ul>

      <h3>4. Use a Budget Tracking App</h3>
      <p>Manual tracking can be time-consuming. A budget tracking app like Opsia.io automates the process, categorizing your expenses and providing insights into your spending habits.</p>

      <h2>Common Budgeting Mistakes to Avoid</h2>
      <ul>
        <li>Ignoring small expenses (they add up!)</li>
        <li>Not adjusting your budget as circumstances change</li>
        <li>Forgetting to track irregular expenses (holidays, car repairs)</li>
        <li>Setting unrealistic financial goals</li>
      </ul>

      <h2>How Opsia.io Simplifies Budget Tracking</h2>
      <p>Opsia.io is designed to make budget management effortless. Key features include:</p>
      <ul>
        <li>✅ Automated Expense Categorization – No more manual calculations</li>
        <li>✅ Advanced Reports & Insights – Understand your spending trends</li>
        <li>✅ Goal-Based Budgeting – Stay on track with savings goals</li>
      </ul>

      <h2>Final Thoughts</h2>
      <p>A well-maintained budget is the foundation of financial success. By using a budget tracking app like Opsia.io, you can eliminate financial stress and make smarter money decisions. Start tracking your budget today and take control of your finances!</p>
    `
  },
  'budgeting-strategies-2025': {
    title: 'Best Budgeting Strategies for 2025: How to Save More and Spend Smarter',
    date: '2024-03-25',
    readTime: '7 min read',
    content: `
      <h2>Introduction</h2>
      <p>With rising costs and economic uncertainties, managing your personal finances effectively is more crucial than ever. Budgeting isn't just about cutting expenses—it's about making your money work smarter. In this article, we'll explore the best budgeting strategies for 2025 and how tools like Opsia.io can help you stay on top of your finances.</p>

      <h2>Why Budgeting Matters More Than Ever</h2>
      <p>2025 presents new financial challenges, including inflation, shifting job markets, and evolving consumer habits. A solid budgeting plan can help you:</p>
      <ul>
        <li>Reduce financial stress</li>
        <li>Save for emergencies and future goals</li>
        <li>Eliminate unnecessary spending</li>
        <li>Invest wisely for long-term security</li>
      </ul>

      <h2>The Best Budgeting Methods for 2025</h2>

      <h3>1. The 50/30/20 Rule (Perfect for Beginners)</h3>
      <ul>
        <li>50% Needs (rent, food, bills)</li>
        <li>30% Wants (entertainment, dining out)</li>
        <li>20% Savings & Investments</li>
      </ul>

      <h3>2. Zero-Based Budgeting (Ideal for Detailed Planners)</h3>
      <ul>
        <li>Every dollar is allocated to a category</li>
        <li>Ensures that income minus expenses equals zero</li>
        <li>Requires tracking but gives full control over spending</li>
      </ul>

      <h3>3. The Envelope System (Great for Cash-Only Budgets)</h3>
      <ul>
        <li>Physical or digital envelopes for different expense categories</li>
        <li>Helps prevent overspending in discretionary areas</li>
      </ul>

      <h3>4. AI-Powered Budgeting with Opsia.io</h3>
      <ul>
        <li>Automated transaction tracking for effortless budgeting</li>
        <li>Custom reports and analytics to improve spending habits</li>
        <li>Smart savings suggestions to help you reach financial goals faster</li>
      </ul>

      <h2>Tips for Sticking to Your Budget</h2>
      <ul>
        <li>Review your finances weekly to stay on track</li>
        <li>Automate savings so you don't forget</li>
        <li>Adjust as needed based on lifestyle changes</li>
        <li>Use a budgeting app like Opsia.io to streamline tracking</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Budgeting is no longer just about spreadsheets—it's about using the right tools to optimize your finances. Whether you prefer a traditional budgeting method or an AI-driven approach, the key is consistency. With Opsia.io, you can track your budget effortlessly and build a more secure financial future.</p>

      <p>🚀 Start your budget tracking journey today with Opsia.io!</p>
    `
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? blogPosts[slug as keyof typeof blogPosts] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-50 mb-4">Post not found</h1>
          <Link 
            to="/blog"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        url: window.location.href
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | Opsia.io Blog</title>
        <meta name="description" content="Learn how to effectively track your budget and take control of your financial future with our comprehensive guide." />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content="Learn how to effectively track your budget and take control of your financial future with our comprehensive guide." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content="Learn how to effectively track your budget and take control of your financial future with our comprehensive guide." />
      </Helmet>

      <div className="min-h-screen bg-dark-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link 
              to="/blog" 
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>
            
            <div className="flex items-center justify-between gap-4 text-dark-400 text-sm mb-4">
              <div className="flex items-center gap-4">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            <h1 className="text-4xl font-bold text-dark-50 mb-8">
              {post.title}
            </h1>

            <div 
              className="prose prose-invert prose-indigo max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
}