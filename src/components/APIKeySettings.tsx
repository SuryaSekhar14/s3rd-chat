"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Key, 
  Sparkles,
  Zap,
  Brain,
  Search,
  Plus,
  ArrowLeft,
  Shield,
  Lock
} from "lucide-react";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import showToast from "@/lib/toast";

interface ProviderConfig {
  name: string;
  key: 'openai' | 'anthropic' | 'google' | 'deepseek';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  placeholder: string;
  docsUrl: string;
}

const providers: ProviderConfig[] = [
  {
    name: "OpenAI",
    key: "openai",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-600",
    description: "GPT-4o, GPT-4o Mini, and other OpenAI models",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys"
  },
  {
    name: "Anthropic",
    key: "anthropic", 
    icon: Brain,
    color: "from-orange-500 to-red-600",
    description: "Claude 4 Sonnet, Claude 3.7 Sonnet, and other Claude models",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/"
  },
  {
    name: "Google",
    key: "google",
    icon: Search,
    color: "from-blue-500 to-indigo-600", 
    description: "Gemini 2.5 Flash, Gemini 2.5 Pro, and other Google models",
    placeholder: "AIza...",
    docsUrl: "https://makersuite.google.com/app/apikey"
  },
  {
    name: "DeepSeek",
    key: "deepseek",
    icon: Zap,
    color: "from-purple-500 to-pink-600",
    description: "DeepSeek Chat, DeepSeek Reasoner, and other DeepSeek models",
    placeholder: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys"
  }
];

export function APIKeySettings() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  
  const {
    apiKeys,
    keyStatuses,
    isLoading,
    updateAPIKey,
    testAPIKey,
    clearAllAPIKeys
  } = useAPIKeys();

  const handleKeyChange = (value: string) => {
    if (!selectedProvider) return;
    updateAPIKey(selectedProvider.key, value);
  };

  const toggleKeyVisibility = () => {
    setShowKey(!showKey);
  };

  const handleTestAPIKey = async () => {
    if (!selectedProvider) return;
    
    const key = apiKeys[selectedProvider.key];
    if (!key || !key.trim()) {
      showToast.error(`Please enter a ${selectedProvider.name} API key first`);
      return;
    }

    setTestingKey(true);

    try {
      const isValid = await testAPIKey(selectedProvider.key, key);
      
      if (isValid) {
        showToast.success(`${selectedProvider.name} API key is valid!`);
      } else {
        showToast.error(`${selectedProvider.name} API key is invalid`);
      }
    } catch (error) {
      showToast.error(`Error testing ${selectedProvider.name} API key`);
      console.error(`Error testing ${selectedProvider.name} API key:`, error);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveAPIKey = () => {
    showToast.success("API key saved successfully!");
  };

  const handleClearAllKeys = () => {
    if (confirm("Are you sure you want to clear all API keys? This action cannot be undone.")) {
      clearAllAPIKeys();
      showToast.success("All API keys cleared");
    }
  };

  const getStatusIcon = (provider: ProviderConfig) => {
    const status = keyStatuses[provider.name];
    
    if (!status) {
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (status.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (provider: ProviderConfig) => {
    const status = keyStatuses[provider.name];
    const hasKey = apiKeys[provider.key] && apiKeys[provider.key]!.trim().length > 0;
    
    if (!hasKey) return "No key";
    if (!status) return "Not tested";
    if (status.isValid) return "Valid";
    return "Invalid";
  };

  const getStatusColor = (provider: ProviderConfig) => {
    const status = keyStatuses[provider.name];
    const hasKey = apiKeys[provider.key] && apiKeys[provider.key]!.trim().length > 0;
    
    if (!hasKey) return "bg-gray-100 text-gray-600";
    if (!status) return "bg-yellow-100 text-yellow-700";
    if (status.isValid) return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedProvider) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
            <Key className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">API Keys</h2>
            <p className="text-muted-foreground text-lg">
              Select a provider to add or manage your API key
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((provider, index) => {
            const Icon = provider.icon;
            const hasKey = apiKeys[provider.key] && apiKeys[provider.key]!.trim().length > 0;
            
            return (
              <Card 
                key={provider.key}
                className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => setSelectedProvider(provider)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${provider.color} opacity-5`} />
                
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${provider.color} text-white shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {provider.name}
                          {getStatusIcon(provider)}
                        </CardTitle>
                        <CardDescription className="text-base">{provider.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(provider)} text-sm font-medium`}>
                      {getStatusText(provider)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {hasKey ? "Click to manage" : "Click to add"}
                    </span>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {keyStatuses[provider.name]?.lastChecked && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last tested: {new Date(keyStatuses[provider.name].lastChecked!).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleClearAllKeys}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Clear All Keys
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-2 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-blue-500 mt-0.5" />
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">How it works</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    Your API keys are encrypted and stored locally in your browser
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    They're never sent to our servers except for validation
                  </li>
                  <li className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-500" />
                    You can use your own keys to access premium models and avoid rate limits
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    If no custom key is provided, we'll use our shared keys (with rate limits)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = selectedProvider.icon;
  const hasKey = apiKeys[selectedProvider.key] && apiKeys[selectedProvider.key]!.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedProvider(null)}
          className="h-10 w-10 rounded-full hover:bg-muted/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedProvider.color} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {selectedProvider.name} API Key
            </h2>
            <p className="text-muted-foreground">{selectedProvider.description}</p>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden border-2 border-primary/10">
        <div className={`absolute inset-0 bg-gradient-to-r ${selectedProvider.color} opacity-5`} />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold">API Key Configuration</span>
              {getStatusIcon(selectedProvider)}
            </div>
            <Badge className={`${getStatusColor(selectedProvider)} text-sm font-medium`}>
              {getStatusText(selectedProvider)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={selectedProvider.placeholder}
                value={apiKeys[selectedProvider.key] || ""}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="pr-12 h-12 text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-10 w-10"
                onClick={toggleKeyVisibility}
              >
                {showKey ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Button
                onClick={handleTestAPIKey}
                disabled={!hasKey || testingKey}
                size="lg"
                variant="outline"
                className="w-full h-12"
              >
                {testingKey ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  "Test Key"
                )}
              </Button>
            </div>
            
            <Button
              onClick={() => window.open(selectedProvider.docsUrl, '_blank')}
              size="lg"
              variant="ghost"
              className="h-12"
            >
              Get Key
            </Button>
          </div>

          {keyStatuses[selectedProvider.name]?.lastChecked && (
            <p className="text-xs text-muted-foreground">
              Last tested: {new Date(keyStatuses[selectedProvider.name].lastChecked!).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          onClick={() => {
            updateAPIKey(selectedProvider.key, '');
            showToast.success(`${selectedProvider.name} API key cleared`);
          }}
          variant="outline"
          size="lg"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          Clear Key
        </Button>
        
        <Button
          onClick={handleSaveAPIKey}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12 px-8"
        >
          Save API Key
        </Button>
      </div>
    </div>
  );
} 