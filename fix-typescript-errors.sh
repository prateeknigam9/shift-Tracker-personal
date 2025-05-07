#!/bin/bash

# Fix all "error is of type unknown" errors
find server/controllers -name "*.ts" -exec sed -i 's/catch (error) {/catch (error: any) {/g' {} \;
find client/src/pages -name "*.tsx" -exec sed -i 's/catch (error) {/catch (error: any) {/g' {} \;

# Replace error.message with error.message || 'Unknown error'
find server/controllers -name "*.ts" -exec sed -i 's/\${error\.message}/\${error\.message || "Unknown error"}/g' {} \;
find client/src/pages -name "*.tsx" -exec sed -i 's/\${error\.message}/\${error\.message || "Unknown error"}/g' {} \;
find client/src/pages -name "*.tsx" -exec sed -i 's/error\.message/error\.message || "Unknown error"/g' {} \;