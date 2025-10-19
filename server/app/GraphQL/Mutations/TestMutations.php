<?php

namespace App\GraphQL\Mutations;

class TestMutations
{
    public function test($rootValue, array $args)
    {
        return "Hello from test mutation!";
    }
}
