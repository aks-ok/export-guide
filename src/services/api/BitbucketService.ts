import { ApiResponse, ApiServiceError, ApiErrorCode } from '../types';
import { errorHandler } from '../ErrorHandler';

interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  description?: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  language?: string;
  has_issues: boolean;
  has_wiki: boolean;
  clone_links: {
    name: string;
    href: string;
  }[];
  links: {
    html: {
      href: string;
    };
  };
}

interface BitbucketPipeline {
  uuid: string;
  build_number: number;
  state: {
    name: 'PENDING' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED' | 'ERROR' | 'STOPPED';
    type: string;
  };
  created_on: string;
  completed_on?: string;
  target: {
    ref_name: string;
    ref_type: string;
    commit: {
      hash: string;
      message: string;
    };
  };
  trigger: {
    name: string;
    type: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

interface BitbucketUser {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  created_on: string;
  type: string;
  links: {
    avatar: {
      href: string;
    };
    html: {
      href: string;
    };
  };
}

interface BitbucketWorkspace {
  uuid: string;
  name: string;
  slug: string;
  type: string;
  created_on: string;
  updated_on: string;
  links: {
    avatar?: {
      href: string;
    };
    html: {
      href: string;
    };
  };
}

class BitbucketService {
  private readonly baseUrl = 'https://api.bitbucket.org/2.0';
  private readonly token: string;
  private readonly workspace: string;

  constructor() {
    this.token = process.env.REACT_APP_BITBUCKET_API_TOKEN || '';
    this.workspace = process.env.REACT_APP_BITBUCKET_WORKSPACE || '';

    if (!this.token) {
      console.warn('Bitbucket API token not configured');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      if (!this.token) {
        throw new ApiServiceError(
          ApiErrorCode.CONFIGURATION_ERROR,
          'Bitbucket API token not configured',
          false
        );
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiServiceError(
            ApiErrorCode.UNAUTHORIZED,
            'Invalid Bitbucket API token',
            false
          );
        }
        if (response.status === 403) {
          throw new ApiServiceError(
            ApiErrorCode.UNAUTHORIZED,
            'Insufficient permissions for Bitbucket API',
            false
          );
        }
        if (response.status === 404) {
          throw new ApiServiceError(
            ApiErrorCode.NOT_FOUND,
            'Bitbucket resource not found',
            false
          );
        }
        throw new ApiServiceError(
          ApiErrorCode.SERVER_ERROR,
          `Bitbucket API error: ${response.status}`,
          true
        );
      }

      const data = await response.json();

      return {
        data,
        success: true,
        timestamp: new Date(),
        source: 'Bitbucket API'
      };

    } catch (error) {
      errorHandler.handleError(
        error instanceof ApiServiceError ? error : new ApiServiceError(
          ApiErrorCode.NETWORK_ERROR,
          `Bitbucket API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true,
          error
        ),
        'BitbucketService.makeRequest'
      );

      return {
        data: null as any,
        success: false,
        timestamp: new Date(),
        source: 'Bitbucket API Error'
      };
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<BitbucketUser>> {
    return this.makeRequest<BitbucketUser>('/user');
  }

  /**
   * Get workspace information
   */
  async getWorkspace(): Promise<ApiResponse<BitbucketWorkspace>> {
    if (!this.workspace) {
      return {
        data: null as any,
        success: false,
        timestamp: new Date(),
        source: 'Configuration Error'
      };
    }
    return this.makeRequest<BitbucketWorkspace>(`/workspaces/${this.workspace}`);
  }

  /**
   * Get repositories in the workspace
   */
  async getRepositories(limit: number = 10): Promise<ApiResponse<BitbucketRepository[]>> {
    if (!this.workspace) {
      return {
        data: [],
        success: false,
        timestamp: new Date(),
        source: 'Configuration Error'
      };
    }

    const response = await this.makeRequest<{ values: BitbucketRepository[] }>(
      `/repositories/${this.workspace}?pagelen=${limit}&sort=-updated_on`
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.values || []
      };
    }

    return {
      data: [],
      success: false,
      timestamp: new Date(),
      source: 'Bitbucket API Error'
    };
  }

  /**
   * Get pipelines for a specific repository
   */
  async getRepositoryPipelines(repoName: string, limit: number = 10): Promise<ApiResponse<BitbucketPipeline[]>> {
    if (!this.workspace) {
      return {
        data: [],
        success: false,
        timestamp: new Date(),
        source: 'Configuration Error'
      };
    }

    const response = await this.makeRequest<{ values: BitbucketPipeline[] }>(
      `/repositories/${this.workspace}/${repoName}/pipelines/?pagelen=${limit}&sort=-created_on`
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.values || []
      };
    }

    return {
      data: [],
      success: false,
      timestamp: new Date(),
      source: 'Bitbucket API Error'
    };
  }

  /**
   * Get pipeline status summary for all repositories
   */
  async getPipelinesSummary(): Promise<ApiResponse<{
    total_pipelines: number;
    successful: number;
    failed: number;
    in_progress: number;
    recent_pipelines: BitbucketPipeline[];
  }>> {
    try {
      const reposResponse = await this.getRepositories(5);
      
      if (!reposResponse.success || !reposResponse.data) {
        throw new Error('Failed to fetch repositories');
      }

      const allPipelines: BitbucketPipeline[] = [];
      
      // Get pipelines for each repository
      for (const repo of reposResponse.data) {
        const pipelinesResponse = await this.getRepositoryPipelines(repo.name, 5);
        if (pipelinesResponse.success && pipelinesResponse.data) {
          allPipelines.push(...pipelinesResponse.data);
        }
      }

      // Sort by creation date
      allPipelines.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());

      const summary = {
        total_pipelines: allPipelines.length,
        successful: allPipelines.filter(p => p.state.name === 'SUCCESSFUL').length,
        failed: allPipelines.filter(p => p.state.name === 'FAILED' || p.state.name === 'ERROR').length,
        in_progress: allPipelines.filter(p => p.state.name === 'IN_PROGRESS' || p.state.name === 'PENDING').length,
        recent_pipelines: allPipelines.slice(0, 10)
      };

      return {
        data: summary,
        success: true,
        timestamp: new Date(),
        source: 'Bitbucket API'
      };

    } catch (error) {
      errorHandler.handleError(
        new ApiServiceError(
          ApiErrorCode.SERVER_ERROR,
          `Failed to get pipelines summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true,
          error
        ),
        'BitbucketService.getPipelinesSummary'
      );

      return {
        data: {
          total_pipelines: 0,
          successful: 0,
          failed: 0,
          in_progress: 0,
          recent_pipelines: []
        },
        success: false,
        timestamp: new Date(),
        source: 'Bitbucket API Error'
      };
    }
  }

  /**
   * Health check for Bitbucket API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getCurrentUser();
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      service: 'Bitbucket API',
      token_configured: !!this.token,
      workspace_configured: !!this.workspace,
      base_url: this.baseUrl,
      scopes: ['admin:pipeline:bitbucket', 'read:account', 'read:me'],
      last_check: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const bitbucketService = new BitbucketService();
export default bitbucketService;