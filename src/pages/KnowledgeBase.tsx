import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, BookOpen, ThumbsUp, Eye, ChevronRight, Home, ExternalLink, Menu, ArrowLeft, ArrowRight, Hash } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    setLoading(true);

    // Load categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("knowledge_base_categories")
      .select("*")
      .order("display_order");

    if (categoriesError) {
      console.error("Error loading categories:", categoriesError);
      toast.error("Failed to load categories");
    } else {
      setCategories(categoriesData || []);
    }

    // Load published articles
    const { data: articlesData, error: articlesError } = await supabase
      .from("knowledge_base_articles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (articlesError) {
      console.error("Error loading articles:", articlesError);
      toast.error("Failed to load articles");
    } else {
      setArticles(articlesData || []);
    }

    setLoading(false);
  };

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory;
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleViewArticle = async (article: Article) => {
    setSelectedArticle(article);
    setSearchTerm("");

    // Increment view count
    await supabase
      .from("knowledge_base_articles")
      .update({ view_count: article.view_count + 1 })
      .eq("id", article.id);
    
    // Reload to get updated counts
    loadData();
  };

  const handleMarkHelpful = async () => {
    if (!selectedArticle) return;

    const { error } = await supabase
      .from("knowledge_base_articles")
      .update({ helpful_count: selectedArticle.helpful_count + 1 })
      .eq("id", selectedArticle.id);

    if (error) {
      toast.error("Failed to mark as helpful");
    } else {
      toast.success("Thank you for your feedback!");
      setSelectedArticle({
        ...selectedArticle,
        helpful_count: selectedArticle.helpful_count + 1,
      });
      loadData();
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || BookOpen;
    return <Icon className="h-5 w-5" />;
  };

  const getArticlesByCategory = (categoryId: string) => {
    return articles.filter((a) => a.category_id === categoryId);
  };

  const currentCategory = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)
    : null;

  // Extract table of contents from article content
  const tableOfContents = useMemo(() => {
    if (!selectedArticle) return [];
    
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const toc: TocItem[] = [];
    let match;
    
    while ((match = headingRegex.exec(selectedArticle.content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      toc.push({ id, text, level });
    }
    
    return toc;
  }, [selectedArticle]);

  // Get next/previous articles
  const { nextArticle, prevArticle } = useMemo(() => {
    if (!selectedArticle || !selectedCategory) return {};
    
    const categoryArticles = filteredArticles.filter(a => a.category_id === selectedCategory);
    const currentIndex = categoryArticles.findIndex(a => a.id === selectedArticle.id);
    
    return {
      nextArticle: currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null,
      prevArticle: currentIndex > 0 ? categoryArticles[currentIndex - 1] : null,
    };
  }, [selectedArticle, selectedCategory, filteredArticles]);

  // Convert markdown-style content to HTML with proper heading IDs
  const renderContent = (content: string) => {
    return content
      .replace(/^### (.+)$/gm, (_, text) => {
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return `<h3 id="${id}">${text}</h3>`;
      })
      .replace(/^## (.+)$/gm, (_, text) => {
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return `<h2 id="${id}">${text}</h2>`;
      })
      .replace(/^# (.+)$/gm, (_, text) => {
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return `<h1 id="${id}">${text}</h1>`;
      })
      .replace(/\n/g, "<br />");
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Left Sidebar - Categories Navigation */}
        <aside className={cn(
          "w-64 border-r border-border bg-card transition-all duration-300 flex-shrink-0",
          !sidebarOpen && "w-0 overflow-hidden"
        )}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Home Button */}
              <Button
                variant={!selectedCategory && !selectedArticle ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedArticle(null);
                  setSearchTerm("");
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>

              <Separator />

              {/* Categories */}
              <div className="space-y-1">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Categories
                </h3>
                {categories.map((category) => {
                  const Icon = (LucideIcons as any)[category.icon] || BookOpen;
                  const articleCount = getArticlesByCategory(category.id).length;
                  const isActive = selectedCategory === category.id;

                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start group"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedArticle(null);
                        setSearchTerm("");
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-xs text-muted-foreground">{articleCount}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fade-in">
              {/* Header with Toggle */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                {/* Search Bar */}
                <div className="flex-1 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search knowledge base..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Breadcrumb */}
              {(selectedCategory || selectedArticle) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedArticle(null);
                      setSearchTerm("");
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    Home
                  </button>
                  {currentCategory && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <button
                        onClick={() => {
                          setSelectedArticle(null);
                          setSearchTerm("");
                        }}
                        className="hover:text-foreground transition-colors"
                      >
                        {currentCategory.name}
                      </button>
                    </>
                  )}
                  {selectedArticle && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-foreground">{selectedArticle.title}</span>
                    </>
                  )}
                </div>
              )}

              {/* Content */}
              {selectedArticle ? (
                // Article View
                <article className="space-y-6 pb-12">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                      {selectedArticle.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {selectedArticle.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {selectedArticle.helpful_count} helpful
                      </span>
                    </div>

                    {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none 
                      prose-headings:scroll-mt-20 prose-headings:font-bold 
                      prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                      prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:border-b prose-h2:pb-2
                      prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                      prose-p:leading-7 prose-p:mb-4
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:bg-muted prose-pre:border prose-pre:border-border
                      prose-ul:my-4 prose-ol:my-4
                      prose-li:my-1"
                    dangerouslySetInnerHTML={{
                      __html: renderContent(selectedArticle.content),
                    }}
                  />

                  {/* Next/Previous Navigation */}
                  {(prevArticle || nextArticle) && (
                    <>
                      <Separator className="my-8" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prevArticle && (
                          <Card 
                            className="p-4 cursor-pointer hover:border-primary transition-all group"
                            onClick={() => handleViewArticle(prevArticle)}
                          >
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <ArrowLeft className="h-4 w-4" />
                              <span>Previous</span>
                            </div>
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {prevArticle.title}
                            </p>
                          </Card>
                        )}
                        {nextArticle && (
                          <Card 
                            className="p-4 cursor-pointer hover:border-primary transition-all group md:ml-auto"
                            onClick={() => handleViewArticle(nextArticle)}
                          >
                            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
                              <span>Next</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                            <p className="font-medium text-right group-hover:text-primary transition-colors">
                              {nextArticle.title}
                            </p>
                          </Card>
                        )}
                      </div>
                    </>
                  )}

                  <Separator className="my-8" />

                  {/* Feedback Section */}
                  <Card className="bg-gradient-card border-primary/20">
                    <div className="p-6 space-y-4">
                      <p className="font-semibold text-lg">Was this article helpful?</p>
                      <div className="flex gap-3">
                        <Button onClick={handleMarkHelpful} variant="default" size="lg">
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Yes, this helped
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <a href="/support">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Contact Support
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </article>
              ) : searchTerm ? (
                // Search Results
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                      Search Results
                    </h1>
                    <p className="text-muted-foreground">
                      {filteredArticles.length} {filteredArticles.length === 1 ? 'result' : 'results'} for "{searchTerm}"
                    </p>
                  </div>

                  {filteredArticles.length === 0 ? (
                    <Card>
                      <div className="p-12 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No articles found</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredArticles.map((article) => (
                        <Card
                          key={article.id}
                          className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleViewArticle(article)}
                        >
                          <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                          {article.excerpt && (
                            <p className="text-muted-foreground mb-3">{article.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {article.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {article.helpful_count}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedCategory ? (
                // Category View
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                      {currentCategory?.name}
                    </h1>
                    <p className="text-muted-foreground">
                      {currentCategory?.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {filteredArticles.length === 0 ? (
                      <Card>
                        <div className="p-12 text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No articles in this category yet</p>
                        </div>
                      </Card>
                    ) : (
                      filteredArticles.map((article) => (
                        <Card
                          key={article.id}
                          className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-md"
                          onClick={() => handleViewArticle(article)}
                        >
                          <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                          {article.excerpt && (
                            <p className="text-muted-foreground mb-3">{article.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {article.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {article.helpful_count}
                            </span>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Home View
                <div className="space-y-12">
                  <div className="text-center space-y-4 py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-4">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
                      Knowledge Base
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      Find answers to common questions and learn how to use NichePerQ
                    </p>
                  </div>

                  {/* Categories Grid */}
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold">Browse by Category</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {categories.map((category) => {
                        const Icon = (LucideIcons as any)[category.icon] || BookOpen;
                        const articleCount = getArticlesByCategory(category.id).length;

                        return (
                          <Card
                            key={category.id}
                            className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 group bg-gradient-card"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gradient-primary rounded-xl group-hover:scale-110 transition-transform">
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {category.description}
                                </p>
                                <p className="text-sm text-primary">
                                  {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Popular Articles */}
                  {articles.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Popular Articles</h2>
                      <div className="space-y-3">
                        {[...articles]
                          .sort((a, b) => b.view_count - a.view_count)
                          .slice(0, 5)
                          .map((article) => (
                            <Card
                              key={article.id}
                              className="p-4 cursor-pointer hover:border-primary transition-all hover:shadow-md"
                              onClick={() => handleViewArticle(article)}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{article.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3.5 w-3.5" />
                                    {article.view_count}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Right Sidebar - Table of Contents (only for articles) */}
          {selectedArticle && tableOfContents.length > 0 && (
            <aside className="hidden xl:block w-64 border-l border-border bg-card flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4 sticky top-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <Hash className="h-4 w-4" />
                    On this page
                  </div>
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(item.id)?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                          setActiveHeading(item.id);
                        }}
                        className={cn(
                          "block py-1 text-sm transition-colors hover:text-primary",
                          item.level === 2 && "pl-0 font-medium",
                          item.level === 3 && "pl-4",
                          activeHeading === item.id ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </ScrollArea>
            </aside>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
