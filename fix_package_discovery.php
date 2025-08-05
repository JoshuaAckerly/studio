<?php

require __DIR__.'/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the package discovery command
$artisan = $app->make('Illuminate\Contracts\Console\Kernel');
$commands = $artisan->all();

if (isset($commands['package:discover'])) {
    $command = $commands['package:discover'];
    
    // Manually set the Laravel application
    $command->setLaravel($app);
    
    // Run the command
    $input = new Symfony\Component\Console\Input\ArrayInput(['command' => 'package:discover']);
    $output = new Symfony\Component\Console\Output\ConsoleOutput();
    
    echo "Running package discovery...\n";
    $result = $command->run($input, $output);
    
    if ($result === 0) {
        echo "Package discovery completed successfully!\n";
    } else {
        echo "Package discovery failed with code: $result\n";
    }
} else {
    echo "Package discovery command not found!\n";
}