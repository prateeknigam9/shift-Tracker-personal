import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Database, 
  Table2, 
  ListFilter, 
  Edit, 
  Trash2, 
  PlaySquare, 
  HardDrive, 
  AlertCircle, 
  ShieldAlert, 
  Loader2,
  CheckCircle2,
  KeyRound,
  ChevronLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // States for tables management
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any>({ columns: [], data: [] });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedRecord, setEditedRecord] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // SQL query execution state
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  // Migration state
  const [migrationScript, setMigrationScript] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  
  // Load tables when the component mounts
  useEffect(() => {
    // Check if user is authenticated and is admin (id === 1 or is_admin === 1)
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (user.id !== 1 && user.is_admin !== 1) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    fetchTables();
  }, [user, navigate]);
  
  // Load table data when a table is selected
  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);
  
  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/admin/tables");
      const data = await response.json();
      setTables(data.map((t: any) => t.table_name));
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch database tables",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const fetchTableData = async (tableName: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/admin/tables/${tableName}`);
      const data = await response.json();
      setTableData(data);
      setIsLoading(false);
    } catch (error: any) {
      console.error(`Error fetching data from ${tableName}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch data from ${tableName}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const handleEditClick = (record: any) => {
    setSelectedRecord(record);
    setEditedRecord({ ...record });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditSave = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(
        "PUT", 
        `/api/admin/tables/${selectedTable}/${selectedRecord.id}`,
        { id: selectedRecord.id, data: editedRecord }
      );
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Record updated successfully",
        });
        fetchTableData(selectedTable);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update record");
      }
      
      setIsEditDialogOpen(false);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error updating record:", error);
      toast({
        title: "Error",
        description: error.message || "Unknown error" || "Failed to update record",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(
        "DELETE", 
        `/api/admin/tables/${selectedTable}/${selectedRecord.id}`
      );
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        });
        fetchTableData(selectedTable);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete record");
      }
      
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error",
        description: error.message || "Unknown error" || "Failed to delete record",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const executeQuery = async (confirmed = false) => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "SQL query cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExecuting(true);
      const response = await apiRequest("POST", "/api/admin/execute", { 
        query: sqlQuery,
        confirmed
      });
      
      const data = await response.json();
      
      if (response.status === 400 && data.requiresConfirmation) {
        setNeedsConfirmation(true);
        setIsExecuting(false);
        return;
      }
      
      setQueryResult(data);
      setNeedsConfirmation(false);
      setIsExecuting(false);
      
      toast({
        title: "Success",
        description: `Query executed successfully (${data.rowCount} rows affected)`,
      });
    } catch (error: any) {
      console.error("Error executing query:", error);
      setIsExecuting(false);
      toast({
        title: "Query Error",
        description: error.message || "Unknown error" || "Failed to execute query",
        variant: "destructive",
      });
    }
  };
  
  const runMigration = async () => {
    if (!migrationScript.trim()) {
      toast({
        title: "Error",
        description: "Migration script cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsMigrating(true);
      const response = await apiRequest("POST", "/api/admin/migrate", { 
        script: migrationScript
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Migration completed successfully",
        });
        fetchTables();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Migration failed");
      }
      
      setIsMigrating(false);
    } catch (error: any) {
      console.error("Error running migration:", error);
      setIsMigrating(false);
      toast({
        title: "Migration Error",
        description: error.message || "Unknown error" || "Failed to run migration",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = "/"} 
              className="hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Database Administration</h1>
          <p className="text-muted-foreground">
            Manage your application database with root-level access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-destructive" />
          <span className="font-medium">Admin Mode</span>
        </div>
      </div>
      
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Table2 size={16} />
            <span>Tables</span>
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Database size={16} />
            <span>SQL Query</span>
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <HardDrive size={16} />
            <span>Migration</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader className="card-header-gradient">
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                Select a table to view and edit its data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={selectedTable}
                  onValueChange={setSelectedTable}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTable && (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Actions</TableHead>
                          {tableData.columns?.map((column: any) => (
                            <TableHead key={column.column_name}>
                              {column.column_name}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({column.data_type})
                              </span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.data?.map((record: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditClick(record)}
                                >
                                  <Edit size={14} className="mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(record)}
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                            {tableData.columns?.map((column: any) => (
                              <TableCell key={column.column_name}>
                                {record[column.column_name]?.toString().length > 30
                                  ? record[column.column_name]?.toString().substring(0, 30) + "..."
                                  : record[column.column_name]?.toString()}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader className="card-header-gradient">
              <CardTitle>Execute SQL Query</CardTitle>
              <CardDescription>
                Run custom SQL queries against your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your SQL query here... (e.g., SELECT * FROM users LIMIT 10)"
                  className="font-mono min-h-[150px]"
                />
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSqlQuery("")}
                  >
                    Clear
                  </Button>
                  
                  {needsConfirmation ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <AlertCircle size={16} className="mr-2" />
                          Confirm Destructive Query
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action might permanently delete or modify data and cannot be undone.
                            Please confirm that you want to execute this potentially destructive query.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => executeQuery(true)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Execute Query
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      onClick={() => executeQuery()}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <PlaySquare size={16} className="mr-2" />
                          Execute Query
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {queryResult && (
                  <div className="border rounded-md overflow-hidden mt-4">
                    <div className="bg-muted p-2 flex justify-between">
                      <div className="font-medium">Results</div>
                      <div className="text-sm text-muted-foreground">
                        {queryResult.rowCount} row(s) affected
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      {queryResult.rows && queryResult.rows.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(queryResult.rows[0]).map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryResult.rows.map((row: any, rowIndex: number) => (
                              <TableRow key={rowIndex}>
                                {Object.values(row).map((value: any, valueIndex: number) => (
                                  <TableCell key={valueIndex}>
                                    {value?.toString()}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No rows returned
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader className="card-header-gradient">
              <CardTitle>Database Migration</CardTitle>
              <CardDescription>
                Execute database schema changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AlertDialog>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-md mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Warning: Use with caution</h4>
                        <p className="text-sm mt-1">
                          Migrations can make permanent changes to your database structure. 
                          Always back up your data before running migrations.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Textarea
                    value={migrationScript}
                    onChange={(e) => setMigrationScript(e.target.value)}
                    placeholder="Enter your migration SQL script here... (e.g., ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE)"
                    className="font-mono min-h-[200px]"
                  />
                  
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setMigrationScript("")}
                    >
                      Clear
                    </Button>
                    
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default"
                        disabled={isMigrating || !migrationScript.trim()}
                      >
                        {isMigrating ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Migrating...
                          </>
                        ) : (
                          <>
                            <HardDrive size={16} className="mr-2" />
                            Run Migration
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Database Migration</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to run a database migration that may alter your schema.
                        This action cannot be easily reverted. Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={runMigration}
                        className="bg-amber-600 text-white hover:bg-amber-700"
                      >
                        Yes, Run Migration
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                {/* Migration examples */}
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Common Migration Examples:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-muted rounded-md font-mono">
                      -- Add a column to a table:
                      <br />
                      ALTER TABLE table_name ADD COLUMN column_name data_type;
                    </div>
                    <div className="p-2 bg-muted rounded-md font-mono">
                      -- Create an index:
                      <br />
                      CREATE INDEX index_name ON table_name (column_name);
                    </div>
                    <div className="p-2 bg-muted rounded-md font-mono">
                      -- Create the sales_kpi table if it doesn't exist:
                      <br />
                      CREATE TABLE IF NOT EXISTS sales_kpi (
                      <br />
                      &nbsp;&nbsp;id SERIAL PRIMARY KEY,
                      <br />
                      &nbsp;&nbsp;user_id INTEGER NOT NULL REFERENCES users(id),
                      <br />
                      &nbsp;&nbsp;shift_id INTEGER NOT NULL REFERENCES shifts(id),
                      <br />
                      &nbsp;&nbsp;tech_insurance_sales INTEGER NOT NULL DEFAULT 0,
                      <br />
                      &nbsp;&nbsp;instant_insurance_sales INTEGER NOT NULL DEFAULT 0,
                      <br />
                      &nbsp;&nbsp;sky_tv_sales INTEGER NOT NULL DEFAULT 0,
                      <br />
                      &nbsp;&nbsp;sky_broadband_sales INTEGER NOT NULL DEFAULT 0,
                      <br />
                      &nbsp;&nbsp;sky_streaming_sales INTEGER NOT NULL DEFAULT 0,
                      <br />
                      &nbsp;&nbsp;notes TEXT,
                      <br />
                      &nbsp;&nbsp;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      <br />
                      );
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Update the values for this record in the {selectedTable} table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {tableData.columns?.map((column: any) => (
              column.column_name !== 'id' && column.column_name !== 'created_at' && (
                <div key={column.column_name} className="grid grid-cols-4 items-center gap-4">
                  <label 
                    htmlFor={column.column_name}
                    className="text-right font-medium text-sm"
                  >
                    {column.column_name}:
                  </label>
                  <Input
                    id={column.column_name}
                    value={editedRecord[column.column_name] || ""}
                    onChange={(e) => 
                      setEditedRecord({ 
                        ...editedRecord, 
                        [column.column_name]: e.target.value 
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              )
            ))}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this record from the {selectedTable} table.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}