import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  Storage as StorageIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { bitbucketService } from '../services/api/BitbucketService';
import { colorPalette } from '../theme/ExportGuideTheme';

const BitbucketDemoPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [pipelinesSummary, setPipelinesSummary] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadBitbucketData();
  }, []);

  const loadBitbucketData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all Bitbucket data in parallel
      const [userResponse, workspaceResponse, reposResponse, pipelinesResponse] = await Promise.all([
        bitbucketService.getCurrentUser(),
        bitbucketService.getWorkspace(),
        bitbucketService.getRepositories(10),
        bitbucketService.getPipelinesSummary(),
      ]);

      if (userResponse.success) {
        setUser(userResponse.data);
      }

      if (workspaceResponse.success) {
        setWorkspace(workspaceResponse.data);
      }

      if (reposResponse.success) {
        setRepositories(reposResponse.data);
      }

      if (pipelinesResponse.success) {
        setPipelinesSummary(pipelinesResponse.data);
      }

      setLastUpdated(new Date());

      // Check if any requests failed
      const hasErrors = [userResponse, workspaceResponse, reposResponse, pipelinesResponse]
        .some(response => !response.success);

      if (hasErrors) {
        setError('Some Bitbucket data could not be loaded. Check your API token and permissions.');
      }

    } catch (err) {
      console.error('Error loading Bitbucket data:', err);
      setError('Failed to load Bitbucket data. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const getPipelineStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <CheckCircleIcon sx={{ color: colorPalette.accent.success }} />;
      case 'FAILED':
      case 'ERROR':
        return <ErrorIcon sx={{ color: colorPalette.accent.error }} />;
      case 'IN_PROGRESS':
      case 'PENDING':
        return <ScheduleIcon sx={{ color: colorPalette.accent.warning }} />;
      default:
        return <ScheduleIcon sx={{ color: colorPalette.neutral[400] }} />;
    }
  };

  const getPipelineStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return 'success';
      case 'FAILED':
      case 'ERROR':
        return 'error';
      case 'IN_PROGRESS':
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Bitbucket Integration Demo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live data from Bitbucket API - Repositories, Pipelines, and Workspace Information
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={loadBitbucketData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {lastUpdated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Last updated: {lastUpdated.toLocaleString()}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                User Information
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : user ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={user.links?.avatar?.href}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {user.display_name?.[0] || user.username?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{user.display_name || user.username}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Account ID: {user.account_id}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Member since: {formatDate(user.created_on)}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No user data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Workspace Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Workspace Information
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : workspace ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={workspace.links?.avatar?.href}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {workspace.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{workspace.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{workspace.slug}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(workspace.created_on)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated: {formatDate(workspace.updated_on)}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No workspace data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pipeline Summary */}
        {pipelinesSummary && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Pipeline Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {pipelinesSummary.total_pipelines}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Pipelines
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: colorPalette.accent.success }}>
                        {pipelinesSummary.successful}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successful
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: colorPalette.accent.error }}>
                        {pipelinesSummary.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: colorPalette.accent.warning }}>
                        {pipelinesSummary.in_progress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Repositories */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Repositories ({repositories.length})
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : repositories.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Repository</TableCell>
                        <TableCell>Language</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Updated</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {repositories.map((repo) => (
                        <TableRow key={repo.uuid}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">{repo.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {repo.description || 'No description'}
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  label={repo.is_private ? 'Private' : 'Public'}
                                  size="small"
                                  color={repo.is_private ? 'secondary' : 'primary'}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {repo.language ? (
                              <Chip label={repo.language} size="small" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatFileSize(repo.size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(repo.updated_on)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Repository">
                              <IconButton
                                size="small"
                                onClick={() => window.open(repo.links.html.href, '_blank')}
                              >
                                <LaunchIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No repositories found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Pipelines */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Pipelines
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : pipelinesSummary?.recent_pipelines?.length > 0 ? (
                <List dense>
                  {pipelinesSummary.recent_pipelines.slice(0, 8).map((pipeline: any) => (
                    <ListItem key={pipeline.uuid} divider>
                      <ListItemIcon>
                        {getPipelineStatusIcon(pipeline.state.name)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                              {pipeline.repository.name}
                            </Typography>
                            <Chip
                              label={pipeline.state.name}
                              size="small"
                              color={getPipelineStatusColor(pipeline.state.name) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              #{pipeline.build_number} • {pipeline.target.ref_name}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(pipeline.created_on)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No recent pipelines</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Configuration Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Token Configured
              </Typography>
              <Typography variant="body1">
                {process.env.REACT_APP_BITBUCKET_API_TOKEN ? '✅ Yes' : '❌ No'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Workspace
              </Typography>
              <Typography variant="body1">
                {process.env.REACT_APP_BITBUCKET_WORKSPACE || 'Not configured'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                API Scopes
              </Typography>
              <Typography variant="body1">
                admin:pipeline, read:account, read:me
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Base URL
              </Typography>
              <Typography variant="body1">
                api.bitbucket.org/2.0
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BitbucketDemoPage;