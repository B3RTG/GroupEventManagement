using GroupEvents.Domain.Entities;

namespace GroupEvents.Tests.Unit.Domain;

public class GroupDomainTests
{
    [Fact]
    public void RegenerateInviteCode_ReturnsNewCode()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        var original = group.InviteCode;

        var returned = group.RegenerateInviteCode();

        Assert.NotEqual(original, returned);
        Assert.Equal(group.InviteCode, returned);
    }

    [Fact]
    public void RegenerateInviteCode_CodeIsEightCharsUpperCase()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        var code = group.RegenerateInviteCode();

        Assert.Equal(8, code.Length);
        Assert.Equal(code.ToUpperInvariant(), code);
    }

    [Fact]
    public void NewGroup_InviteLinkEnabledByDefault()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        Assert.True(group.InviteLinkEnabled);
    }

    [Fact]
    public void NewGroup_IsActiveByDefault()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        Assert.True(group.IsActive);
    }

    [Fact]
    public void SetInviteLinkEnabled_False_DisablesLink()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        group.SetInviteLinkEnabled(false);
        Assert.False(group.InviteLinkEnabled);
    }

    [Fact]
    public void Deactivate_SetsIsActiveFalse()
    {
        var group = new Group("Test", "test", Guid.NewGuid());
        group.Deactivate();
        Assert.False(group.IsActive);
    }
}
