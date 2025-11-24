import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, BookOpen, ThumbsUp, Eye, ChevronRight, Home, ExternalLink } from "lucide-react";
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

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Sidebar Navigation */}
        <aside className={cn(
          "w-64 border-r border-border bg-card transition-all duration-300",
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
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fade-in">
              {/* Search Bar */}
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 -mt-4 pt-4">
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
                <article className="space-y-6">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">{selectedArticle.title}</h1>
                    
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
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-a:text-primary hover:prose-a:text-primary/80"
                    dangerouslySetInnerHTML={{
                      __html: selectedArticle.content.replace(/\n/g, "<br />"),
                    }}
                  />

                  <Separator />

                  {/* Feedback Section */}
                  <Card className="bg-muted/50">
                    <div className="p-6 space-y-4">
                      <p className="font-medium">Was this article helpful?</p>
                      <div className="flex gap-3">
                        <Button onClick={handleMarkHelpful} variant="default">
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Yes, this helped
                        </Button>
                        <Button variant="outline" asChild>
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
                  <div className="text-center space-y-4 py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      Find answers to common questions and learn how to use NichePerQ
                    </p>
                  </div>

                  {/* Categories Grid */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Browse by Category</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {categories.map((category) => {
                        const Icon = (LucideIcons as any)[category.icon] || BookOpen;
                        const articleCount = getArticlesByCategory(category.id).length;

                        return (
                          <Card
                            key={category.id}
                            className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-md group"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Icon className="h-6 w-6 text-primary" />
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
        </main>
      </div>
    </DashboardLayout>
  );
}
